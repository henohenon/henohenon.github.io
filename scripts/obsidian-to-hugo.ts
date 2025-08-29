#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';
import * as yaml from 'js-yaml';

// Configuration constants
const CONFIG = {
  SLUG_LENGTH: 12,
  SLUG_CHARSET: 'abcdefghijklmnopqrstuvwxyz0123456789',
  EXCLUDED_DIRS: ['.obsidian', 'templates'],
  EXCLUDED_FILES: ['.vault-nickname'],
  DEFAULT_TIMEZONE: '+09:00',
  IMAGE_PATH_PREFIX: '/',
  RELATIVE_LINK_PREFIX: '../'
} as const;

// Pre-compiled regex patterns
const PATTERNS = {
  IMAGE_EMBED: /!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g,
  WIKILINK_WITH_ALIAS: /(?<!\!)\[\[([^|\]]+)\|([^\]]+)\]\]/g,
  WIKILINK_SIMPLE: /(?<!\!)\[\[([^\]]+)\]\]/g,
  OBSIDIAN_TAG: /(?:^|[\s])#([a-zA-Z0-9_\-/\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/gm,
  WHITESPACE_CLEANUP: /\n\s*\n/g
} as const;

/**
 * Get timezone offset for date formatting
 */
function getTimezoneOffset(): string {
  return CONFIG.DEFAULT_TIMEZONE;
}

/**
 * Ensure directory exists, creating it recursively if needed
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Custom error class for conversion operations
 */
class ConversionError extends Error {
  constructor(message: string, public filePath?: string) {
    super(message);
    this.name = 'ConversionError';
  }
}

/**
 * Result interface for processing operations
 */
interface ProcessResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Interface for conversion operation results
 */
interface ConversionResult {
  convertedFiles: number;
  copiedAssets: number;
  skippedFiles: string[];
  errors: ConversionError[];
}

/**
 * Interface for processing context
 */
interface ProcessingContext {
  markdownFiles: string[];
  allAssetFiles: string[];
  fileNameToSlugMapping: Map<string, string>;
}

/**
 * Configuration options for conversion
 */
interface ConversionOptions {
  inputDir?: string;
  outputDir?: string;
  staticDir?: string;
  generateRandomSlugs?: boolean;
  preserveUnusedAssets?: boolean;
  timezone?: string;
}

/**
 * Safe wrapper for processing files with unified error handling
 */
function safeProcessFile(filePath: string, fileNameToSlugMapping: Map<string, string>, referencedImages: Set<string>): ProcessResult<string> {
  try {
    const result = processFile(filePath, fileNameToSlugMapping, referencedImages);
    if (result === null) {
      return { success: false, error: `Failed to process file: ${filePath}` };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

interface GrayMatterFile<T = any> {
  data: T;
  content: string;
}

interface HugoFrontmatter {
  title?: string;
  date?: string;
  draft?: boolean;
  slug?: string;
  tags?: string[];
  [key: string]: any;
}

interface TagExtractionResult {
  tags: string[];
  cleanContent: string;
}

/**
 * Convert Obsidian image embeds ![[image.png]] to markdown image syntax
 * Returns both converted content and set of referenced images
 */
function convertImageEmbeds(content: string, referencedImages: Set<string>): string {
  // Handle both cases in a single pass: ![[image.png|Alt Text]] and ![[image.png]]
  return content.replace(PATTERNS.IMAGE_EMBED, (match: string, imageName: string, altText?: string): string => {
    // Track this image as referenced
    referencedImages.add(imageName);
    
    const encodedImageName = encodeURIComponent(imageName);
    const finalAltText = altText || path.basename(imageName, path.extname(imageName));
    return `![${finalAltText}](${CONFIG.IMAGE_PATH_PREFIX}${encodedImageName})`;
  });
}

/**
 * Build a mapping of filename to slug for all markdown files
 */
function buildFileNameToSlugMapping(inputDir: string): Map<string, string> {
  const mapping = new Map<string, string>();
  const markdownFiles = findMarkdownFiles(inputDir);
  
  for (const filePath of markdownFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = matter.default(content) as GrayMatterFile<HugoFrontmatter>;
      const fileName = path.basename(filePath, '.md');
      
      // Determine what slug will be assigned to this file
      let slug: string;
      if (parsed.data.slug && parsed.data.slug.trim() !== '') {
        slug = parsed.data.slug;
      } else {
        slug = generateRandomSlug();
      }
      
      mapping.set(fileName, slug);
    } catch (error) {
      console.error(`Error reading file ${filePath} for mapping:`, error);
    }
  }
  
  return mapping;
}

/**
 * Convert Obsidian wikilinks [[Page Name]] to Hugo markdown links
 */
function convertWikilinks(content: string, fileNameToSlugMapping: Map<string, string>): string {
  // Handle wikilinks with aliases: [[Page Name|Display Text]]
  content = content.replace(PATTERNS.WIKILINK_WITH_ALIAS, (match: string, pageName: string, displayText: string): string => {
    const slug = fileNameToSlugMapping.get(pageName);
    if (slug) {
      return `[${displayText}](${CONFIG.RELATIVE_LINK_PREFIX}${slug}/)`;
    } else {
      // If page not found in mapping, keep original wikilink or convert to broken link
      console.warn(`Wikilink target "${pageName}" not found in file mapping`);
      return `[${displayText}](${CONFIG.RELATIVE_LINK_PREFIX}${pageName}/)`;
    }
  });

  // Handle simple wikilinks: [[Page Name]]
  content = content.replace(PATTERNS.WIKILINK_SIMPLE, (match: string, pageName: string): string => {
    const slug = fileNameToSlugMapping.get(pageName);
    if (slug) {
      return `[${pageName}](${CONFIG.RELATIVE_LINK_PREFIX}${slug}/)`;
    } else {
      // If page not found in mapping, keep original wikilink or convert to broken link
      console.warn(`Wikilink target "${pageName}" not found in file mapping`);
      return `[${pageName}](${CONFIG.RELATIVE_LINK_PREFIX}${pageName}/)`;
    }
  });

  return content;
}

/**
 * Extract tags from content and remove them
 */
function extractObsidianTags(content: string): TagExtractionResult {
  const tags: string[] = [];
  
  // Extract inline tags (including Japanese characters)
  let match: RegExpExecArray | null;

  while ((match = PATTERNS.OBSIDIAN_TAG.exec(content)) !== null) {
    tags.push(match[1]);
  }

  // Remove tags from content and clean up whitespace
  let cleanContent = content.replace(PATTERNS.OBSIDIAN_TAG, '');
  cleanContent = cleanContent.replace(PATTERNS.WHITESPACE_CLEANUP, '\n\n');
  
  return { tags, cleanContent };
}

/**
 * Generate random slug using configured length and charset
 */
function generateRandomSlug(): string {
  let result = '';
  for (let i = 0; i < CONFIG.SLUG_LENGTH; i++) {
    result += CONFIG.SLUG_CHARSET.charAt(Math.floor(Math.random() * CONFIG.SLUG_CHARSET.length));
  }
  return result;
}


/**
 * Get output file path maintaining directory structure
 */
function getOutputFilePath(inputFilePath: string, inputDir: string, outputDir: string): string {
  const relativePath = path.relative(inputDir, inputFilePath);
  return path.join(outputDir, relativePath);
}

/**
 * Process a single markdown file
 * Returns both converted content and set of referenced images
 */
function processFile(filePath: string, fileNameToSlugMapping: Map<string, string>, referencedImages: Set<string>): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = matter.default(content) as GrayMatterFile<HugoFrontmatter>;
    
    // Extract tags from content
    const { tags: contentTags, cleanContent } = extractObsidianTags(parsed.content);
    
    // Convert image embeds and wikilinks
    let convertedContent = convertImageEmbeds(cleanContent, referencedImages);
    convertedContent = convertWikilinks(convertedContent, fileNameToSlugMapping);

    // Auto-complete frontmatter fields if they don't exist
    const frontmatter: HugoFrontmatter = { ...parsed.data };
    
    if (!frontmatter.title) {
      frontmatter.title = path.basename(filePath, '.md');
    }
    
    if (!frontmatter.date) {
      frontmatter.date = new Date().toISOString().replace('Z', getTimezoneOffset());
    }
    
    if (frontmatter.draft === undefined) {
      frontmatter.draft = false;
    }
    
    if (!frontmatter.slug || frontmatter.slug.trim() === '') {
      frontmatter.slug = generateRandomSlug();
    }

    // Merge tags (existing + extracted)
    const allTags = (frontmatter.tags || []).concat(contentTags);
    const uniqueTags = Array.from(new Set(allTags));
    if (uniqueTags.length > 0) {
      frontmatter.tags = uniqueTags;
    }

    // Create new content with frontmatter
    const yamlContent = yaml.dump(frontmatter, {
      quotingType: '"' as const,
      forceQuotes: true
    });
    const hugoContent = `---\n${yamlContent}---\n${convertedContent}`;
    return hugoContent;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Copy asset file to static directory, preserving directory structure
 */
function copyAssetFile(filePath: string, inputDir: string, staticDir: string): boolean {
  try {
    const relativePath = path.relative(inputDir, filePath);
    const staticPath = path.join(staticDir, relativePath);
    
    ensureDirectoryExists(staticPath);
    fs.copyFileSync(filePath, staticPath);
    return true;
  } catch (error) {
    console.error(`Error copying asset ${filePath}:`, error);
    return false;
  }
}

/**
 * Find files recursively with a custom filter predicate
 */
function findFiles(dir: string, fileFilter: (fileName: string) => boolean): string[] {
  const files: string[] = [];
  const traverse = (currentDir: string): void => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !(CONFIG.EXCLUDED_DIRS as readonly string[]).includes(entry.name)) {
        traverse(fullPath);
      } else if (entry.isFile() && fileFilter(entry.name)) {
        files.push(fullPath);
      }
    }
  };
  traverse(dir);
  return files;
}

/**
 * Find markdown files recursively
 */
function findMarkdownFiles(dir: string): string[] {
  return findFiles(dir, (fileName) => fileName.endsWith('.md'));
}

/**
 * Find asset files (non-markdown files)
 */
function findAssetFiles(dir: string): string[] {
  return findFiles(dir, (fileName) => !fileName.endsWith('.md') && !(CONFIG.EXCLUDED_FILES as readonly string[]).includes(fileName));
}

/**
 * Filter asset files to only include those that are referenced
 */
function findReferencedAssetFiles(inputDir: string, referencedImages: Set<string>): string[] {
  const allAssets = findAssetFiles(inputDir);
  return allAssets.filter(assetPath => {
    const fileName = path.basename(assetPath);
    return referencedImages.has(fileName);
  });
}

/**
 * Initialize conversion context with file discovery and mapping
 */
function initializeConversion(inputDir: string): ProcessingContext {
  const markdownFiles = findMarkdownFiles(inputDir);
  const allAssetFiles = findAssetFiles(inputDir);
  
  console.log(`Processing ${markdownFiles.length} markdown files and ${allAssetFiles.length} total assets`);

  // Build filename to slug mapping before processing
  console.log('Building filename to slug mapping...');
  const fileNameToSlugMapping = buildFileNameToSlugMapping(inputDir);
  console.log(`Created mapping for ${fileNameToSlugMapping.size} files`);

  return {
    markdownFiles,
    allAssetFiles,
    fileNameToSlugMapping
  };
}

/**
 * Clean output and static directories
 */
function cleanupDirectories(outputDir: string, staticDir: string): void {
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  if (fs.existsSync(staticDir)) {
    fs.rmSync(staticDir, { recursive: true, force: true });
  }
}

/**
 * Process markdown files and collect referenced images
 */
function processMarkdownFiles(
  markdownFiles: string[],
  fileNameToSlugMapping: Map<string, string>,
  inputDir: string,
  outputDir: string,
  referencedImages: Set<string>
): number {
  let converted = 0;
  
  for (const filePath of markdownFiles) {
    const result = safeProcessFile(filePath, fileNameToSlugMapping, referencedImages);
    if (result.success && result.data) {
      try {
        const outputPath = getOutputFilePath(filePath, inputDir, outputDir);
        ensureDirectoryExists(outputPath);
        fs.writeFileSync(outputPath, result.data, 'utf8');
        converted++;
      } catch (error) {
        console.error(`Failed to write output file for ${filePath}:`, error);
      }
    } else {
      console.error(`Failed to process ${filePath}: ${result.error}`);
    }
  }
  
  return converted;
}

/**
 * Copy referenced assets to static directory
 */
function copyReferencedAssets(
  inputDir: string,
  staticDir: string,
  referencedImages: Set<string>
): number {
  const referencedAssetFiles = findReferencedAssetFiles(inputDir, referencedImages);
  let copied = 0;

  console.log(`Found ${referencedImages.size} referenced images, copying ${referencedAssetFiles.length} asset files`);

  for (const filePath of referencedAssetFiles) {
    if (copyAssetFile(filePath, inputDir, staticDir)) {
      copied++;
    }
  }

  return copied;
}

/**
 * Log conversion results
 */
function logConversionResults(
  converted: number,
  copied: number,
  allAssetFiles: string[],
  referencedAssetFiles: string[]
): void {
  const unusedAssets = allAssetFiles.length - referencedAssetFiles.length;
  console.log(`Conversion complete: ${converted} files converted, ${copied} assets copied`);
  if (unusedAssets > 0) {
    console.log(`✓ Cleaned up ${unusedAssets} unused asset files`);
  }
}

/**
 * Convert all files from obsidian to content
 */
function convertObsidianToHugo(options: ConversionOptions = {}): void {
  const config = {
    inputDir: './obsidian',
    outputDir: './content',
    staticDir: './static',
    generateRandomSlugs: true,
    preserveUnusedAssets: false,
    timezone: CONFIG.DEFAULT_TIMEZONE,
    ...options
  };

  const context = initializeConversion(config.inputDir);
  cleanupDirectories(config.outputDir, config.staticDir);
  
  const referencedImages = new Set<string>();
  const converted = processMarkdownFiles(context.markdownFiles, context.fileNameToSlugMapping, config.inputDir, config.outputDir, referencedImages);
  const copied = copyReferencedAssets(config.inputDir, config.staticDir, referencedImages);
  const referencedAssetFiles = findReferencedAssetFiles(config.inputDir, referencedImages);
  
  logConversionResults(converted, copied, context.allAssetFiles, referencedAssetFiles);
}

// Main execution
if (require.main === module) {
  const options: ConversionOptions = {
    inputDir: process.argv[2] || './obsidian',
    outputDir: process.argv[3] || './content',
    staticDir: process.argv[4] || './static'
  };
  
  convertObsidianToHugo(options);
}

export default convertObsidianToHugo;
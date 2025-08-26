#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

// Type definitions for gray-matter since @types/gray-matter doesn't exist
interface GrayMatterFile<T = any> {
  data: T;
  content: string;
  excerpt?: string;
  empty?: boolean;
  isEmpty?: boolean;
}

interface HugoFrontmatter {
  title: string;
  date: string;
  draft: boolean;
  tags?: string[];
  categories?: string[];
  [key: string]: any;
}

interface TagExtractionResult {
  tags: string[];
  cleanContent: string;
}

interface FrontmatterData {
  title?: string;
  date?: string;
  draft?: boolean;
  tags?: string[];
  categories?: string[];
  [key: string]: any;
}

class ObsidianToHugoConverter {
  private readonly contentDir: string;
  private readonly outputDir: string;
  private readonly obsidianDir: string;

  constructor(contentDir: string = './content', outputDir: string = './dist') {
    this.contentDir = contentDir;
    this.outputDir = outputDir;
    this.obsidianDir = path.join(contentDir, '.obsidian');
  }

  /**
   * Convert Obsidian wikilinks [[Page Name]] to Hugo markdown links
   */
  convertWikilinks(content: string): string {
    // Handle wikilinks with aliases: [[Page Name|Display Text]]
    content = content.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (match: string, pageName: string, displayText: string): string => {
      const slug = this.pageNameToSlug(pageName);
      return `[${displayText}](../${slug}/)`;
    });

    // Handle simple wikilinks: [[Page Name]]
    content = content.replace(/\[\[([^\]]+)\]\]/g, (match: string, pageName: string): string => {
      const slug = this.pageNameToSlug(pageName);
      return `[${pageName}](../${slug}/)`;
    });

    return content;
  }

  /**
   * Convert page names to URL-friendly slugs
   */
  pageNameToSlug(pageName: string): string {
    return pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, ''); // More precise trim for leading/trailing dashes
  }

  /**
   * Extract Obsidian tags from content
   */
  extractObsidianTags(content: string): TagExtractionResult {
    const tagRegex = /#([a-zA-Z0-9_\-/]+)/g;
    const tags: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    // Remove tags from content
    const cleanContent = content.replace(tagRegex, '').replace(/\n\s*\n/g, '\n\n');
    
    return { tags, cleanContent };
  }

  /**
   * Generate Hugo frontmatter
   */
  generateHugoFrontmatter(data: FrontmatterData, filename: string): HugoFrontmatter {
    const frontmatter: HugoFrontmatter = {
      title: data.title || this.filenameToTitle(filename),
      date: data.date || new Date().toISOString(),
      draft: data.draft !== undefined ? data.draft : false,
    };

    // Add tags if they exist
    if (data.tags && data.tags.length > 0) {
      frontmatter.tags = data.tags;
    }

    // Add categories if they exist
    if (data.categories && data.categories.length > 0) {
      frontmatter.categories = data.categories;
    }

    // Preserve other frontmatter fields
    Object.keys(data).forEach((key: string): void => {
      if (!['title', 'date', 'draft', 'tags', 'categories'].includes(key)) {
        frontmatter[key] = data[key];
      }
    });

    return frontmatter;
  }

  /**
   * Calculate output file path maintaining relative structure
   */
  getOutputFilePath(inputFilePath: string): string {
    const relativePath = path.relative(this.contentDir, inputFilePath);
    return path.join(this.outputDir, relativePath);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  ensureDirectoryExists(filePath: string): void {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  /**
   * Convert filename to title
   */
  filenameToTitle(filename: string): string {
    return path.basename(filename, '.md')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l: string): string => l.toUpperCase());
  }

  /**
   * Process a single markdown file
   */
  processFile(filePath: string): string | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = matter(content) as GrayMatterFile<FrontmatterData>;
      
      // Extract tags from content
      const { tags: contentTags, cleanContent } = this.extractObsidianTags(parsed.content);
      
      // Merge frontmatter tags with content tags
      const allTags: string[] = [
        ...(parsed.data.tags || []),
        ...contentTags
      ].filter((tag: string, index: number, array: string[]): boolean => 
        array.indexOf(tag) === index
      ); // Remove duplicates

      // Convert wikilinks
      const convertedContent = this.convertWikilinks(cleanContent);

      // Generate Hugo frontmatter
      const hugoFrontmatter = this.generateHugoFrontmatter({
        ...parsed.data,
        tags: allTags.length > 0 ? allTags : undefined
      }, filePath);

      // Create new content with Hugo frontmatter
      const hugoContent = matter.stringify(convertedContent, hugoFrontmatter);

      return hugoContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing file ${filePath}:`, errorMessage);
      return null;
    }
  }

  /**
   * Convert all markdown files in the content directory
   */
  convertAll(): void {
    const markdownFiles = this.findMarkdownFiles(this.contentDir);
    let converted = 0;

    console.log(`Found ${markdownFiles.length} markdown files to process`);
    console.log(`Output directory: ${path.resolve(this.outputDir)}`);

    // Clean output directory if it exists
    if (fs.existsSync(this.outputDir)) {
      fs.rmSync(this.outputDir, { recursive: true, force: true });
    }

    markdownFiles.forEach((filePath: string): void => {
      console.log(`Processing: ${filePath}`);
      
      const convertedContent = this.processFile(filePath);
      if (convertedContent !== null) {
        const outputPath = this.getOutputFilePath(filePath);
        this.ensureDirectoryExists(outputPath);
        fs.writeFileSync(outputPath, convertedContent, 'utf8');
        converted++;
        console.log(`✓ Converted: ${filePath} → ${outputPath}`);
      } else {
        console.log(`✗ Failed: ${filePath}`);
      }
    });

    console.log(`\nConversion complete! ${converted}/${markdownFiles.length} files converted to ${this.outputDir}.`);
  }

  /**
   * Find all markdown files, excluding Obsidian directory
   */
  findMarkdownFiles(dir: string): string[] {
    const files: string[] = [];

    const traverse = (currentDir: string): void => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      entries.forEach((entry: fs.Dirent): void => {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          // Skip .obsidian directory
          if (entry.name !== '.obsidian') {
            traverse(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      });
    };

    traverse(dir);
    return files;
  }
}

// Main execution
if (require.main === module) {
  const contentDir: string = process.argv[2] || './content';
  const outputDir: string = process.argv[3] || './dist';
  const converter = new ObsidianToHugoConverter(contentDir, outputDir);
  
  console.log('Obsidian to Hugo Converter');
  console.log(`Content directory: ${path.resolve(contentDir)}`);
  console.log(`Output directory: ${path.resolve(outputDir)}`);
  console.log('Starting conversion...\n');
  
  converter.convertAll();
}

export default ObsidianToHugoConverter;
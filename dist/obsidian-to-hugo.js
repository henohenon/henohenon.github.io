#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const gray_matter_1 = __importDefault(require("gray-matter"));
const js_yaml_1 = __importDefault(require("js-yaml"));
/**
 * Convert Obsidian image embeds ![[image.png]] to markdown image syntax
 * Returns both converted content and set of referenced images
 */
function convertImageEmbeds(content, referencedImages) {
    // Handle both cases in a single pass: ![[image.png|Alt Text]] and ![[image.png]]
    return content.replace(/!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (match, imageName, altText) => {
        // Track this image as referenced
        referencedImages.add(imageName);
        const encodedImageName = encodeURIComponent(imageName);
        const finalAltText = altText || path.basename(imageName, path.extname(imageName));
        return `![${finalAltText}](/${encodedImageName})`;
    });
}
/**
 * Build a mapping of filename to slug for all markdown files
 */
function buildFileNameToSlugMapping(inputDir) {
    const mapping = new Map();
    const markdownFiles = findMarkdownFiles(inputDir);
    for (const filePath of markdownFiles) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const parsed = (0, gray_matter_1.default)(content);
            const fileName = path.basename(filePath, '.md');
            // Determine what slug will be assigned to this file
            let slug;
            if (parsed.data.slug && parsed.data.slug.trim() !== '') {
                slug = parsed.data.slug;
            }
            else {
                slug = generateRandomSlug();
            }
            mapping.set(fileName, slug);
        }
        catch (error) {
            console.error(`Error reading file ${filePath} for mapping:`, error);
        }
    }
    return mapping;
}
/**
 * Convert Obsidian wikilinks [[Page Name]] to Hugo markdown links
 */
function convertWikilinks(content, fileNameToSlugMapping) {
    // Handle wikilinks with aliases: [[Page Name|Display Text]]
    content = content.replace(/(?<!\!)\[\[([^|\]]+)\|([^\]]+)\]\]/g, (match, pageName, displayText) => {
        const slug = fileNameToSlugMapping.get(pageName);
        if (slug) {
            return `[${displayText}](../${slug}/)`;
        }
        else {
            // If page not found in mapping, keep original wikilink or convert to broken link
            console.warn(`Wikilink target "${pageName}" not found in file mapping`);
            return `[${displayText}](../${pageName}/)`;
        }
    });
    // Handle simple wikilinks: [[Page Name]]
    content = content.replace(/(?<!\!)\[\[([^\]]+)\]\]/g, (match, pageName) => {
        const slug = fileNameToSlugMapping.get(pageName);
        if (slug) {
            return `[${pageName}](../${slug}/)`;
        }
        else {
            // If page not found in mapping, keep original wikilink or convert to broken link
            console.warn(`Wikilink target "${pageName}" not found in file mapping`);
            return `[${pageName}](../${pageName}/)`;
        }
    });
    return content;
}
// Only match tags that are preceded by whitespace or at start of line to avoid matching hashtags within words
const tagRegex = /(?:^|[\s])#([a-zA-Z0-9_\-/\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+)/gm;
/**
 * Extract tags from content and remove them
 */
function extractObsidianTags(content) {
    const tags = [];
    // Extract inline tags (including Japanese characters)
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        tags.push(match[1]);
    }
    // Remove tags from content and clean up whitespace
    let cleanContent = content.replace(tagRegex, '');
    cleanContent = cleanContent.replace(/\n\s*\n/g, '\n\n');
    return { tags, cleanContent };
}
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
/**
 * Generate random 12-character slug
 */
function generateRandomSlug() {
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Ensure directory exists
 */
function ensureDirectoryExists(filePath) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}
/**
 * Get output file path maintaining directory structure
 */
function getOutputFilePath(inputFilePath, inputDir, outputDir) {
    const relativePath = path.relative(inputDir, inputFilePath);
    return path.join(outputDir, relativePath);
}
/**
 * Process a single markdown file
 * Returns both converted content and set of referenced images
 */
function processFile(filePath, fileNameToSlugMapping, referencedImages) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = (0, gray_matter_1.default)(content);
        // Extract tags from content
        const { tags: contentTags, cleanContent } = extractObsidianTags(parsed.content);
        // Convert image embeds and wikilinks
        let convertedContent = convertImageEmbeds(cleanContent, referencedImages);
        convertedContent = convertWikilinks(convertedContent, fileNameToSlugMapping);
        // Auto-complete frontmatter fields if they don't exist
        const frontmatter = { ...parsed.data };
        if (!frontmatter.title) {
            frontmatter.title = path.basename(filePath, '.md');
        }
        if (!frontmatter.date) {
            frontmatter.date = new Date().toISOString().replace('Z', '+09:00');
        }
        if (frontmatter.draft === undefined) {
            frontmatter.draft = false;
        }
        if (!frontmatter.slug || frontmatter.slug.trim() === '') {
            frontmatter.slug = generateRandomSlug();
        }
        // Merge tags (existing + extracted)
        const allTags = [...(frontmatter.tags || []), ...contentTags];
        const uniqueTags = [...new Set(allTags)];
        if (uniqueTags.length > 0) {
            frontmatter.tags = uniqueTags;
        }
        // Create new content with frontmatter
        const yamlContent = js_yaml_1.default.dump(frontmatter, {
            quotingType: '"',
            forceQuotes: true
        });
        const hugoContent = `---\n${yamlContent}---\n${convertedContent}`;
        return hugoContent;
    }
    catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        return null;
    }
}
/**
 * Copy asset file to static directory, preserving directory structure
 */
function copyAssetFile(filePath, inputDir, staticDir) {
    try {
        const relativePath = path.relative(inputDir, filePath);
        const staticPath = path.join(staticDir, relativePath);
        ensureDirectoryExists(staticPath);
        fs.copyFileSync(filePath, staticPath);
        return true;
    }
    catch (error) {
        console.error(`Error copying asset ${filePath}:`, error);
        return false;
    }
}
/**
 * Find files recursively with a custom filter predicate
 */
function findFiles(dir, fileFilter) {
    const files = [];
    const traverse = (currentDir) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory() && entry.name !== '.obsidian' && entry.name !== 'templates') {
                traverse(fullPath);
            }
            else if (entry.isFile() && fileFilter(entry.name)) {
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
function findMarkdownFiles(dir) {
    return findFiles(dir, (fileName) => fileName.endsWith('.md'));
}
/**
 * Find asset files (non-markdown files)
 */
function findAssetFiles(dir) {
    return findFiles(dir, (fileName) => !fileName.endsWith('.md') && fileName !== '.vault-nickname');
}
/**
 * Filter asset files to only include those that are referenced
 */
function findReferencedAssetFiles(inputDir, referencedImages) {
    const allAssets = findAssetFiles(inputDir);
    return allAssets.filter(assetPath => {
        const fileName = path.basename(assetPath);
        return referencedImages.has(fileName);
    });
}
/**
 * Convert all files from obsidian to content
 */
function convertObsidianToHugo(inputDir = './obsidian', outputDir = './content', staticDir = './static') {
    const markdownFiles = findMarkdownFiles(inputDir);
    const allAssetFiles = findAssetFiles(inputDir);
    console.log(`Processing ${markdownFiles.length} markdown files and ${allAssetFiles.length} total assets`);
    // Build filename to slug mapping before processing
    console.log('Building filename to slug mapping...');
    const fileNameToSlugMapping = buildFileNameToSlugMapping(inputDir);
    console.log(`Created mapping for ${fileNameToSlugMapping.size} files`);
    // Clean output and static directories
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    if (fs.existsSync(staticDir)) {
        fs.rmSync(staticDir, { recursive: true, force: true });
    }
    // Track referenced images across all markdown files
    const referencedImages = new Set();
    let converted = 0;
    // Process markdown files and collect referenced images
    for (const filePath of markdownFiles) {
        const convertedContent = processFile(filePath, fileNameToSlugMapping, referencedImages);
        if (convertedContent !== null) {
            const outputPath = getOutputFilePath(filePath, inputDir, outputDir);
            ensureDirectoryExists(outputPath);
            fs.writeFileSync(outputPath, convertedContent, 'utf8');
            converted++;
        }
    }
    // Find and copy only referenced asset files
    const referencedAssetFiles = findReferencedAssetFiles(inputDir, referencedImages);
    let copied = 0;
    console.log(`Found ${referencedImages.size} referenced images, copying ${referencedAssetFiles.length} asset files`);
    for (const filePath of referencedAssetFiles) {
        if (copyAssetFile(filePath, inputDir, staticDir)) {
            copied++;
        }
    }
    const unusedAssets = allAssetFiles.length - referencedAssetFiles.length;
    console.log(`Conversion complete: ${converted} files converted, ${copied} assets copied`);
    if (unusedAssets > 0) {
        console.log(`✓ Cleaned up ${unusedAssets} unused asset files`);
    }
}
// Main execution
if (require.main === module) {
    const inputDir = process.argv[2] || './obsidian';
    const outputDir = process.argv[3] || './content';
    const staticDir = process.argv[4] || './static';
    convertObsidianToHugo(inputDir, outputDir, staticDir);
}
exports.default = convertObsidianToHugo;

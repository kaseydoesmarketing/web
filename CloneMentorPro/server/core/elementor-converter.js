import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';
import * as csstree from 'css-tree';

class ElementorConverter {
  constructor() {
    this.elementCounter = 0;
    this.globalStyles = {};
    this.fonts = new Set();
    this.colors = new Set();
  }

  generateElementId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async convertToElementor(html, css, pageInfo) {
    const $ = cheerio.load(html);
    
    // Parse global styles
    this.parseGlobalStyles(css);
    
    // Build Elementor structure
    const content = await this.buildElementorContent($, $('body'));
    
    // Create proper Elementor template format
    const template = {
      version: "0.4",
      title: pageInfo.title || 'Cloned Page',
      type: "page",
      content: content,
      page_settings: this.buildPageSettings(),
      metadata: {
        created_at: new Date().toISOString(),
        source_url: pageInfo.url,
        cloned_by: 'CloneMentor Pro',
        elementor_version: '3.16.0'
      }
    };

    return template;
  }

  parseGlobalStyles(css) {
    try {
      const ast = csstree.parse(css);
      
      csstree.walk(ast, (node) => {
        if (node.type === 'Rule') {
          const selector = csstree.generate(node.prelude);
          const styles = {};
          
          csstree.walk(node.block, (decl) => {
            if (decl.type === 'Declaration') {
              const property = decl.property;
              const value = csstree.generate(decl.value);
              styles[property] = value;
              
              // Collect fonts
              if (property === 'font-family') {
                const fonts = value.split(',').map(f => f.trim().replace(/['"]/g, ''));
                fonts.forEach(font => this.fonts.add(font));
              }
              
              // Collect colors
              if (property.includes('color')) {
                this.colors.add(value);
              }
            }
          });
          
          this.globalStyles[selector] = styles;
        }
      });
    } catch (error) {
      console.error('CSS parsing error:', error);
    }
  }

  async buildElementorContent($, element) {
    const sections = [];
    const children = element.children().filter((i, el) => {
      const tag = $(el).prop('tagName')?.toLowerCase();
      return tag && !['script', 'style', 'meta', 'link'].includes(tag);
    });

    let currentSection = null;
    let currentColumn = null;

    children.each((index, child) => {
      const $child = $(child);
      const tagName = $child.prop('tagName')?.toLowerCase();
      
      // Create or reuse section
      if (!currentSection || this.shouldCreateNewSection($child)) {
        currentSection = this.createSection($child);
        sections.push(currentSection);
        
        // Create column in section
        currentColumn = this.createColumn();
        currentSection.elements.push(currentColumn);
      }
      
      // Convert element to widget
      const widget = this.elementToWidget($, $child);
      if (widget) {
        currentColumn.elements.push(widget);
      }
    });

    return sections.length > 0 ? sections : [this.createDefaultSection()];
  }

  shouldCreateNewSection($element) {
    const display = $element.css('display');
    const position = $element.css('position');
    const tagName = $element.prop('tagName')?.toLowerCase();
    
    return ['section', 'header', 'footer', 'main', 'article'].includes(tagName) ||
           display === 'flex' || display === 'grid' ||
           position === 'absolute' || position === 'fixed';
  }

  createSection($element = null) {
    const section = {
      id: this.generateElementId(),
      elType: 'section',
      settings: {},
      elements: [],
      isInner: false
    };

    if ($element) {
      const styles = this.extractStyles($element);
      
      // Background
      if (styles['background-color']) {
        section.settings.background_background = 'classic';
        section.settings.background_color = styles['background-color'];
      }
      
      if (styles['background-image']) {
        section.settings.background_background = 'classic';
        section.settings.background_image = {
          url: styles['background-image'].replace(/url\(['"]?(.*?)['"]?\)/, '$1'),
          id: ''
        };
      }
      
      // Padding
      section.settings.padding = this.parseSpacing(styles, 'padding');
      
      // Margin
      section.settings.margin = this.parseSpacing(styles, 'margin');
      
      // Height
      if (styles['min-height']) {
        section.settings.min_height = {
          size: parseInt(styles['min-height']),
          unit: 'px'
        };
      }
    }

    return section;
  }

  createColumn() {
    return {
      id: this.generateElementId(),
      elType: 'column',
      settings: {
        _column_size: 100,
        _inline_size: null
      },
      elements: [],
      isInner: false
    };
  }

  elementToWidget($, $element) {
    const tagName = $element.prop('tagName')?.toLowerCase();
    const text = $element.text().trim();
    const styles = this.extractStyles($element);

    let widget = {
      id: this.generateElementId(),
      elType: 'widget',
      settings: {},
      elements: [],
      widgetType: 'text-editor'
    };

    // Determine widget type based on element
    switch(tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        widget.widgetType = 'heading';
        widget.settings.title = text;
        widget.settings.header_size = tagName;
        widget.settings.align = styles['text-align'] || 'left';
        break;
        
      case 'img':
        widget.widgetType = 'image';
        widget.settings.image = {
          url: $element.attr('src') || '',
          id: ''
        };
        widget.settings.image_size = 'full';
        if ($element.attr('alt')) {
          widget.settings.caption = $element.attr('alt');
        }
        break;
        
      case 'a':
        if ($element.find('img').length > 0) {
          // Image link
          widget.widgetType = 'image';
          const $img = $element.find('img').first();
          widget.settings.image = {
            url: $img.attr('src') || '',
            id: ''
          };
          widget.settings.link = {
            url: $element.attr('href') || '',
            is_external: true,
            nofollow: false
          };
        } else if (this.looksLikeButton($element)) {
          // Button
          widget.widgetType = 'button';
          widget.settings.text = text;
          widget.settings.link = {
            url: $element.attr('href') || '',
            is_external: true,
            nofollow: false
          };
          widget.settings.button_type = 'default';
          widget.settings.size = 'md';
        } else {
          // Text link
          widget.widgetType = 'text-editor';
          widget.settings.editor = `<a href="${$element.attr('href') || '#'}">${text}</a>`;
        }
        break;
        
      case 'button':
        widget.widgetType = 'button';
        widget.settings.text = text;
        widget.settings.button_type = 'default';
        widget.settings.size = 'md';
        break;
        
      case 'p':
      case 'div':
      case 'span':
        if (text) {
          widget.widgetType = 'text-editor';
          widget.settings.editor = `<p>${text}</p>`;
        } else if ($element.children().length > 0) {
          // Has children, process recursively
          return null;
        }
        break;
        
      case 'ul':
      case 'ol':
        widget.widgetType = 'text-editor';
        const listHtml = $.html($element);
        widget.settings.editor = listHtml;
        break;
        
      case 'iframe':
        const src = $element.attr('src') || '';
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
          widget.widgetType = 'video';
          widget.settings.youtube_url = src;
          widget.settings.video_type = 'youtube';
        } else {
          widget.widgetType = 'html';
          widget.settings.html = $.html($element);
        }
        break;
        
      case 'form':
        widget.widgetType = 'form';
        widget.settings.form_fields = this.extractFormFields($, $element);
        widget.settings.button_text = 'Submit';
        break;
        
      default:
        if (text) {
          widget.widgetType = 'text-editor';
          widget.settings.editor = `<div>${text}</div>`;
        } else {
          return null;
        }
    }

    // Apply typography settings
    if (styles['font-family']) {
      widget.settings.typography_typography = 'custom';
      widget.settings.typography_font_family = styles['font-family'];
    }
    
    if (styles['font-size']) {
      widget.settings.typography_font_size = {
        size: parseInt(styles['font-size']),
        unit: 'px'
      };
    }
    
    if (styles['font-weight']) {
      widget.settings.typography_font_weight = styles['font-weight'];
    }
    
    if (styles['line-height']) {
      widget.settings.typography_line_height = {
        size: parseFloat(styles['line-height']),
        unit: 'em'
      };
    }
    
    if (styles['color']) {
      widget.settings.color = styles['color'];
    }

    // Apply spacing
    widget.settings.padding = this.parseSpacing(styles, 'padding');
    widget.settings.margin = this.parseSpacing(styles, 'margin');

    return widget;
  }

  looksLikeButton($element) {
    const classes = ($element.attr('class') || '').toLowerCase();
    const styles = this.extractStyles($element);
    
    return classes.includes('btn') || 
           classes.includes('button') ||
           styles['background-color'] ||
           styles['border-radius'] ||
           (styles['padding'] && styles['display'] === 'inline-block');
  }

  extractStyles($element) {
    const styles = {};
    const inlineStyle = $element.attr('style') || '';
    
    // Parse inline styles
    if (inlineStyle) {
      const declarations = inlineStyle.split(';');
      declarations.forEach(decl => {
        const [property, value] = decl.split(':').map(s => s.trim());
        if (property && value) {
          styles[property] = value;
        }
      });
    }
    
    // Get computed styles from global styles
    const classes = ($element.attr('class') || '').split(' ');
    classes.forEach(className => {
      if (className && this.globalStyles[`.${className}`]) {
        Object.assign(styles, this.globalStyles[`.${className}`]);
      }
    });
    
    const id = $element.attr('id');
    if (id && this.globalStyles[`#${id}`]) {
      Object.assign(styles, this.globalStyles[`#${id}`]);
    }
    
    return styles;
  }

  parseSpacing(styles, type) {
    const spacing = {
      unit: 'px',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      isLinked: false
    };
    
    if (styles[type]) {
      const values = styles[type].split(' ').map(v => v.replace('px', ''));
      if (values.length === 1) {
        spacing.top = spacing.right = spacing.bottom = spacing.left = values[0];
        spacing.isLinked = true;
      } else if (values.length === 2) {
        spacing.top = spacing.bottom = values[0];
        spacing.left = spacing.right = values[1];
      } else if (values.length === 4) {
        spacing.top = values[0];
        spacing.right = values[1];
        spacing.bottom = values[2];
        spacing.left = values[3];
      }
    }
    
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      const key = `${type}-${side}`;
      if (styles[key]) {
        spacing[side] = styles[key].replace('px', '');
      }
    });
    
    return spacing;
  }

  extractFormFields($, $form) {
    const fields = [];
    
    $form.find('input, textarea, select').each((index, field) => {
      const $field = $(field);
      const type = $field.attr('type') || 'text';
      const name = $field.attr('name') || `field_${index}`;
      const placeholder = $field.attr('placeholder') || '';
      const required = $field.attr('required') !== undefined;
      
      fields.push({
        custom_id: name,
        field_label: placeholder || name,
        field_type: type,
        required: required,
        field_options: '',
        width: '100',
        _id: this.generateElementId()
      });
    });
    
    return fields;
  }

  buildPageSettings() {
    return {
      template: 'elementor_canvas',
      viewport_mobile: 767,
      viewport_tablet: 1024
    };
  }

  buildCustomCSS(css) {
    // Extract and clean CSS for Elementor
    return css.replace(/body\s*\{[^}]*\}/g, '')
              .replace(/html\s*\{[^}]*\}/g, '')
              .replace(/\*\s*\{[^}]*\}/g, '')
              .trim();
  }

  buildGlobalSettings() {
    return {
      colors: Array.from(this.colors).slice(0, 4).map((color, index) => ({
        _id: this.generateElementId(),
        title: `Primary Color ${index + 1}`,
        color: color
      })),
      fonts: Array.from(this.fonts).slice(0, 6).map((font, index) => ({
        _id: this.generateElementId(),
        title: `Primary Font ${index + 1}`,
        font_family: font,
        font_weight: '400'
      })),
      custom_css: '',
      viewport_mobile: 767,
      viewport_tablet: 1024
    };
  }

  createDefaultSection() {
    const section = this.createSection();
    const column = this.createColumn();
    
    column.elements.push({
      id: this.generateElementId(),
      elType: 'widget',
      settings: {
        title: 'Welcome to your cloned page',
        header_size: 'h1',
        align: 'center'
      },
      elements: [],
      widgetType: 'heading'
    });
    
    section.elements.push(column);
    return section;
  }
}

export default ElementorConverter;
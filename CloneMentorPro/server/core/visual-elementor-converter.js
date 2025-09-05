import { v4 as uuidv4 } from 'uuid';

class VisualElementorConverter {
  constructor() {
    this.elementCounter = 0;
    this.globalColors = new Set();
    this.globalFonts = new Set();
  }

  generateElementId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async convertVisualToElementor(visualData, verificationReport) {
    // Handle both old and new data structures
    const visualStructure = visualData.visualData || visualData;
    const { responsiveLayouts, assets, pageInfo } = visualData;
    
    // Extract global assets
    this.extractGlobalAssets(assets);
    
    // Build Elementor structure from visual data
    const content = this.buildElementorFromVisual(visualStructure, responsiveLayouts);
    
    // Create responsive settings
    const responsiveSettings = this.buildResponsiveSettings(responsiveLayouts);
    
    // Create lean, optimized Elementor template focused on structure only
    const customCSS = this.buildOptimizedCSS(visualData);
    
    const template = {
      version: "0.4",
      title: pageInfo?.title || 'Cloned Page',
      type: "page",
      content: content,
      page_settings: {
        ...this.buildPageSettings(),
        ...responsiveSettings,
        custom_css: customCSS
      },
      // Lean metadata - no HTML duplication
      metadata: {
        created_at: new Date().toISOString(),
        source_url: visualData.url || pageInfo?.url,
        cloned_by: 'CloneMentor Pro v2.1 - Optimized',
        elementor_version: '3.16.0',
        clone_version: '2.1',
        fidelity_score: verificationReport?.fidelityScore || 0,
        verification_passed: verificationReport?.passed || false,
        // Essential stats only
        total_elements: this.countTotalElements(content),
        sections_count: content.length,
        capture_method: 'lean-structure-focused'
      }
    };
    
    // AGGRESSIVE validation and cleaning - prevent inflation
    const validatedTemplate = this.validateAndCleanTemplate(template);
    const finalSize = JSON.stringify(validatedTemplate).length;
    console.log(`Generated ULTRA-LEAN Elementor template: ${finalSize} bytes`);
    
    // CRITICAL FIX: Increased threshold from 25KB to 150KB for complex websites
    // Complex WordPress sites legitimately need larger templates to preserve content
    if (finalSize > 150000) {
      console.warn(`⚠️ LARGE TEMPLATE WARNING: ${Math.round(finalSize / 1024)}KB - Template is large but preserving content quality`);
      // Apply SMART cleaning instead of aggressive cleaning to preserve essential content
      return this.smartCleanTemplate(validatedTemplate);
    }
    
    return validatedTemplate;
  }

  extractGlobalAssets(assets) {
    if (!assets) return;
    
    // Extract colors
    if (assets.colors) {
      assets.colors.forEach(color => {
        if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
          this.globalColors.add(color);
        }
      });
    }
    
    // Extract fonts
    if (assets.fonts) {
      assets.fonts.forEach(font => {
        if (font && font !== 'inherit') {
          this.globalFonts.add(font);
        }
      });
    }
  }

  buildElementorFromVisual(visualStructure, responsiveLayouts) {
    if (!visualStructure) return [];
    
    // Priority 1: Use pre-built elementorStructure if available (comprehensive capture)
    // Comprehensive search for elementorStructure in all possible paths
    let elementorStructure = null;
    
    // Helper function to recursively search for elementorStructure
    const findElementorStructure = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Direct match
      if (obj.elementorStructure) {
        console.log(`✅ Found elementorStructure at: ${path}.elementorStructure`);
        return obj.elementorStructure;
      }
      
      // If this object has elements array and looks like elementor structure
      if (obj.elements && Array.isArray(obj.elements) && obj.elements.length > 0) {
        console.log(`✅ Found elements array at: ${path} with ${obj.elements.length} items`);
        return obj;
      }
      
      // Search in nested objects
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const found = findElementorStructure(value, path ? `${path}.${key}` : key);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    // Search for elementorStructure
    elementorStructure = findElementorStructure(visualStructure, 'root');
    
    console.log('🔍 Available keys at root:', Object.keys(visualStructure));
    if (!elementorStructure) {
      console.log('❌ No elementorStructure found in any location');
    }
                               
    if (elementorStructure && elementorStructure.elements) {
      console.log('✅ Using pre-built Elementor structure with', 
        elementorStructure.elements.length, 'sections');
      
      // Validate and use the pre-built structure
      const preBuiltSections = elementorStructure.elements;
      if (Array.isArray(preBuiltSections) && preBuiltSections.length > 0) {
        // Return the sections directly - they're already in Elementor format!
        return preBuiltSections;
      }
    }
    
    console.log('⚠️ No pre-built elementor structure found, checking paths:', {
      hasElementorStructure: !!visualStructure.elementorStructure,
      hasNestedElementorStructure: !!(visualStructure.structure && visualStructure.structure.elementorStructure),
      visualStructureKeys: Object.keys(visualStructure || {}),
      structureKeys: visualStructure.structure ? Object.keys(visualStructure.structure) : 'no structure'
    });
    
    // Priority 2: Fall back to building from raw structure
    console.log('Pre-built structure not available, building from raw structure');
    const actualStructure = visualStructure.structure || visualStructure;
    if (!actualStructure) return [];
    
    const sections = [];
    let currentSection = null;
    
    const processElement = (element, parentType = 'body', depth = 0) => {
      if (!element || depth > 30) return null; // Increased depth for comprehensive capture
      
      const elementType = this.determineElementorType(element, parentType);
      
      switch (elementType) {
        case 'section':
          const section = this.createSection(element, responsiveLayouts);
          
          // Process children as columns
          if (element.children && element.children.length > 0) {
            const columns = this.createColumnsFromChildren(element.children, responsiveLayouts);
            section.elements = columns;
          }
          
          return section;
          
        case 'column':
          const column = this.createColumn(element, responsiveLayouts);
          
          // Process children as widgets
          if (element.children && element.children.length > 0) {
            const widgets = element.children
              .map(child => processElement(child, 'column', depth + 1))
              .filter(Boolean);
            column.elements = widgets;
          }
          
          return column;
          
        case 'widget':
          return this.createWidget(element, responsiveLayouts);
          
        default:
          // If not a recognized type, try to process children
          if (element.children && element.children.length > 0) {
            const childResults = element.children
              .map(child => processElement(child, parentType, depth + 1))
              .filter(Boolean);
            return childResults.length === 1 ? childResults[0] : childResults;
          }
          return null;
      }
    };
    
    // Process the main structure with better handling of nested content
    if (actualStructure.children && actualStructure.children.length > 0) {
      actualStructure.children.forEach(child => {
        const result = processElement(child, 'body', 0);
        if (result) {
          if (Array.isArray(result)) {
            sections.push(...result);
          } else {
            sections.push(result);
          }
        }
      });
    } else if (actualStructure.tagName) {
      // Handle cases where the root element itself contains content
      const result = processElement(actualStructure, 'body', 0);
      if (result) {
        if (Array.isArray(result)) {
          sections.push(...result);
        } else {
          sections.push(result);
        }
      }
    }
    
    // Ensure we have at least one section
    if (sections.length === 0) {
      sections.push(this.createDefaultSection());
    }
    
    // Ensure all sections have columns
    return sections.map(section => {
      if (section.elType === 'section' && (!section.elements || section.elements.length === 0)) {
        section.elements = [this.createDefaultColumn()];
      }
      return section;
    });
  }

  determineElementorType(element, parentType) {
    const { tagName, layout, children, textContent, innerHTML } = element;
    
    // Enhanced section logic - main structural containers
    if (parentType === 'body') {
      const isStructuralElement = ['section', 'header', 'footer', 'main', 'article', 'nav', 'aside'].includes(tagName);
      const isLargeContainer = layout && layout.height > 200 && layout.width > 300;
      const hasMultipleChildren = children && children.length > 2;
      
      if (isStructuralElement || isLargeContainer || hasMultipleChildren) {
        return 'section';
      }
      
      // For divs, check if they're layout containers
      if (tagName === 'div') {
        const isFlexContainer = layout && ['flex', 'grid'].includes(layout.display);
        const hasLayoutChildren = children && children.some(child => 
          child.layout && child.layout.width > 100
        );
        
        if (isFlexContainer || hasLayoutChildren || hasMultipleChildren) {
          return 'section';
        }
      }
    }
    
    // Enhanced column logic - layout containers within sections
    if (parentType === 'section') {
      const hasContent = (textContent && textContent.trim()) || (innerHTML && innerHTML.trim());
      const hasChildren = children && children.length > 0;
      const isColumnCandidate = ['div', 'article', 'aside', 'section'].includes(tagName);
      
      if (hasChildren || hasContent || isColumnCandidate) {
        return 'column';
      }
    }
    
    // Enhanced widget logic - actual content elements
    if (parentType === 'column') {
      return 'widget';
    }
    
    // Leaf nodes are always widgets
    if (!children || children.length === 0) {
      return 'widget';
    }
    
    // Fallback hierarchy logic with better intelligence
    if (parentType === 'body') {
      // Check if this element has substantial content to warrant a section
      const hasSubstantialContent = (textContent && textContent.length > 50) || 
                                   (children && children.length > 1);
      return hasSubstantialContent ? 'section' : 'widget';
    }
    
    if (parentType === 'section') return 'column';
    return 'widget';
  }

  createColumnsFromChildren(children, responsiveLayouts) {
    if (!children || children.length === 0) {
      return [this.createDefaultColumn()];
    }
    
    // Enhanced column creation with intelligent grouping
    const columns = [];
    let currentColumnChildren = [];
    
    // Analyze layout to determine optimal column structure
    const layoutAnalysis = this.analyzeChildrenLayout(children);
    
    children.forEach((child, index) => {
      const shouldStartNewColumn = this.shouldStartNewColumn(child, currentColumnChildren, layoutAnalysis);
      
      if (shouldStartNewColumn && currentColumnChildren.length > 0) {
        // Create column from current children
        const column = this.createColumn({ children: currentColumnChildren }, responsiveLayouts);
        const widgets = currentColumnChildren
          .map(c => this.createWidget(c, responsiveLayouts))
          .filter(Boolean);
        
        if (widgets.length > 0) {
          column.elements = widgets;
          columns.push(column);
        }
        currentColumnChildren = [child];
      } else {
        currentColumnChildren.push(child);
      }
    });
    
    // Add remaining children as final column
    if (currentColumnChildren.length > 0) {
      const column = this.createColumn({ children: currentColumnChildren }, responsiveLayouts);
      const widgets = currentColumnChildren
        .map(c => this.createWidget(c, responsiveLayouts))
        .filter(Boolean);
      
      if (widgets.length > 0) {
        column.elements = widgets;
        columns.push(column);
      }
    }
    
    // Ensure we have at least one column
    if (columns.length === 0) {
      return [this.createDefaultColumn()];
    }
    
    // Calculate intelligent column widths based on content and layout
    return this.calculateIntelligentColumnWidths(columns, layoutAnalysis);
  }

  analyzeChildrenLayout(children) {
    const analysis = {
      totalWidth: 0,
      averageWidth: 0,
      hasFlexLayout: false,
      hasGridLayout: false,
      positionBreaks: [],
      contentTypes: new Set()
    };
    
    children.forEach((child, index) => {
      if (child.layout) {
        analysis.totalWidth += child.layout.width || 0;
        if (child.layout.display === 'flex') analysis.hasFlexLayout = true;
        if (child.layout.display === 'grid') analysis.hasGridLayout = true;
        
        if (['absolute', 'fixed'].includes(child.layout.position)) {
          analysis.positionBreaks.push(index);
        }
      }
      
      analysis.contentTypes.add(child.tagName);
    });
    
    analysis.averageWidth = children.length > 0 ? analysis.totalWidth / children.length : 0;
    
    return analysis;
  }
  
  shouldStartNewColumn(child, currentChildren, layoutAnalysis) {
    if (currentChildren.length === 0) return false;
    
    const { layout, tagName } = child;
    
    // Start new column for positioned elements
    if (layout && ['absolute', 'fixed'].includes(layout.position)) {
      return true;
    }
    
    // Start new column for major structural elements
    if (['section', 'header', 'footer', 'main', 'article', 'aside'].includes(tagName)) {
      return true;
    }
    
    // Consider layout-based column breaks
    if (layout && layoutAnalysis) {
      // If this element is significantly wider than average, it might need its own column
      const isWideElement = layout.width > layoutAnalysis.averageWidth * 1.5;
      if (isWideElement && currentChildren.length > 0) {
        return true;
      }
      
      // If we have a flex/grid layout, respect the natural breaks
      if (layoutAnalysis.hasFlexLayout || layoutAnalysis.hasGridLayout) {
        const previousChild = currentChildren[currentChildren.length - 1];
        if (previousChild?.layout && layout.y > previousChild.layout.y + previousChild.layout.height) {
          return true; // Y-position indicates a new row/column
        }
      }
    }
    
    // Don't start new column if we already have too many columns
    return false;
  }

  calculateIntelligentColumnWidths(columns, layoutAnalysis) {
    if (columns.length === 0) return [];
    if (columns.length === 1) {
      columns[0].settings._column_size = 100;
      columns[0].settings._inline_size = null;
      return columns;
    }
    
    // Analyze content to determine optimal widths
    const contentWeights = columns.map(column => {
      let weight = 1; // Base weight
      
      // Increase weight for columns with more widgets
      weight += (column.elements?.length || 0) * 0.2;
      
      // Increase weight for columns with images or media
      const hasMedia = column.elements?.some(widget => 
        ['image', 'video'].includes(widget.widgetType)
      );
      if (hasMedia) weight += 0.5;
      
      // Increase weight for columns with forms
      const hasForm = column.elements?.some(widget => 
        widget.widgetType === 'html' && 
        (widget.settings?.html?.includes('<form') || widget.settings?.html?.includes('<input'))
      );
      if (hasForm) weight += 0.3;
      
      return weight;
    });
    
    const totalWeight = contentWeights.reduce((sum, weight) => sum + weight, 0);
    
    // Calculate proportional widths
    let usedWidth = 0;
    return columns.map((column, index) => {
      let width;
      
      if (index === columns.length - 1) {
        // Last column gets remaining width
        width = 100 - usedWidth;
      } else {
        // Calculate proportional width
        width = Math.round((contentWeights[index] / totalWeight) * 100);
        
        // Ensure minimum and maximum widths
        width = Math.max(15, Math.min(70, width));
      }
      
      usedWidth += width;
      
      column.settings._column_size = width;
      column.settings._inline_size = null;
      return column;
    });
  }

  createSection(element, responsiveLayouts) {
    const { layout } = element;
    const settings = {
      content_width: 'boxed',
      height: 'default',
      structure: '10'  // Single column by default
    };
    
    if (layout) {
      // Background
      if (layout.backgroundColor && layout.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        settings.background_background = 'classic';
        settings.background_color = layout.backgroundColor;
      }
      
      if (layout.backgroundImage && layout.backgroundImage !== 'none') {
        settings.background_background = 'classic';
        const imageUrl = this.extractImageUrl(layout.backgroundImage);
        if (imageUrl) {
          settings.background_image = { url: imageUrl };
          settings.background_size = layout.backgroundSize || 'cover';
          settings.background_position = layout.backgroundPosition || 'center center';
        }
      }
      
      // Spacing
      settings.padding = this.convertSpacing(layout.padding);
      settings.margin = this.convertSpacing(layout.margin);
      
      // Height
      if (layout.height && parseInt(layout.height) > 100) {
        settings.height = 'min-height';
        settings.custom_height = { size: parseInt(layout.height), unit: 'px' };
      }
    }
    
    return {
      id: this.generateElementId(),
      elType: 'section',
      settings,
      elements: [],
      isInner: false
    };
  }

  createColumn(element, responsiveLayouts) {
    const { layout } = element || {};
    const settings = {
      _column_size: 100,
      _inline_size: null
    };
    
    if (layout) {
      // Background
      if (layout.backgroundColor && layout.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        settings.background_background = 'classic';
        settings.background_color = layout.backgroundColor;
      }
      
      // Spacing
      settings.padding = this.convertSpacing(layout.padding);
      settings.margin = this.convertSpacing(layout.margin);
      
      // Border
      if (layout.border && layout.border !== 'none') {
        settings.border_border = 'solid';
        settings.border_width = { top: 1, right: 1, bottom: 1, left: 1, unit: 'px' };
        settings.border_color = layout.borderColor || '#000000';
      }
      
      if (layout.borderRadius && layout.borderRadius !== '0px') {
        settings.border_radius = {
          top: parseInt(layout.borderRadius) || 0,
          right: parseInt(layout.borderRadius) || 0,
          bottom: parseInt(layout.borderRadius) || 0,
          left: parseInt(layout.borderRadius) || 0,
          unit: 'px'
        };
      }
    }
    
    return {
      id: this.generateElementId(),
      elType: 'column',
      settings,
      elements: [],
      isInner: false
    };
  }

  createWidget(element, responsiveLayouts) {
    if (!element) return null;
    
    const { tagName, textContent, innerHTML, attributes, layout, children } = element;
    const baseSettings = {
      _element_id: this.generateElementId()
    };
    
    // Add common styling
    if (layout) {
      if (layout.color) baseSettings.color = layout.color;
      if (layout.backgroundColor && layout.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        baseSettings.background_background = 'classic';
        baseSettings.background_color = layout.backgroundColor;
      }
      
      // Typography
      if (layout.fontFamily) baseSettings.typography_typography = 'custom';
      if (layout.fontFamily) baseSettings.typography_font_family = layout.fontFamily;
      if (layout.fontSize) baseSettings.typography_font_size = { size: parseInt(layout.fontSize), unit: 'px' };
      if (layout.fontWeight) baseSettings.typography_font_weight = layout.fontWeight;
      if (layout.lineHeight) baseSettings.typography_line_height = { size: parseFloat(layout.lineHeight), unit: 'em' };
      if (layout.textAlign) baseSettings.align = layout.textAlign;
      
      // Spacing
      baseSettings.padding = this.convertSpacing(layout.padding);
      baseSettings.margin = this.convertSpacing(layout.margin);
      
      // Border and effects
      if (layout.borderRadius && layout.borderRadius !== '0px') {
        baseSettings.border_radius = {
          top: parseInt(layout.borderRadius) || 0,
          right: parseInt(layout.borderRadius) || 0,
          bottom: parseInt(layout.borderRadius) || 0,
          left: parseInt(layout.borderRadius) || 0,
          unit: 'px'
        };
      }
      
      if (layout.boxShadow && layout.boxShadow !== 'none') {
        baseSettings.box_shadow_box_shadow = layout.boxShadow;
      }
    }
    
    // Widget-specific logic
    switch (tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'heading',
          settings: {
            ...baseSettings,
            title: textContent || 'Heading',
            header_size: tagName,
            size: 'default'
          }
        };
        
      case 'img':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'image',
          settings: {
            ...baseSettings,
            image: attributes?.src ? { url: attributes.src } : {},
            image_size: 'full',
            caption: attributes?.alt || '',
            align: 'center'
          }
        };
        
      case 'a':
        // Check if it's a button-like link
        const isButton = this.isButtonLike(element);
        
        if (isButton) {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'button',
            settings: {
              ...baseSettings,
              text: textContent || 'Click here',
              link: attributes?.href ? { url: attributes.href, is_external: true } : {},
              size: 'md',
              button_type: 'success'
            }
          };
        } else {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'text-editor',
            settings: {
              ...baseSettings,
              editor: `<a href="${attributes?.href || '#'}">${textContent || 'Link'}</a>`
            }
          };
        }
        
      case 'p':
      case 'span':
      case 'div':
        const content = innerHTML && innerHTML.trim() ? innerHTML : textContent;
        if (content && content.trim()) {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'text-editor',
            settings: {
              ...baseSettings,
              editor: innerHTML && innerHTML.trim() ? innerHTML : `<${tagName}>${textContent}</${tagName}>`
            }
          };
        }
        break;
        
      case 'form':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'html',
          settings: {
            ...baseSettings,
            html: element.outerHTML || innerHTML || `<form>${textContent}</form>`,
            title: 'Form Element'
          }
        };
        
      case 'input':
      case 'textarea':
      case 'select':
        const inputType = attributes?.type || 'text';
        const placeholder = attributes?.placeholder || '';
        const value = attributes?.value || '';
        
        if (['submit', 'button'].includes(inputType)) {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'button',
            settings: {
              ...baseSettings,
              text: value || textContent || 'Submit',
              size: 'md',
              button_type: 'primary'
            }
          };
        } else {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'html',
            settings: {
              ...baseSettings,
              html: element.outerHTML || `<${tagName} type="${inputType}" placeholder="${placeholder}" value="${value}" />`,
              title: `${tagName.toUpperCase()} Field`
            }
          };
        }
        
      case 'video':
      case 'iframe':
        const videoSrc = attributes?.src || '';
        if (videoSrc.includes('youtube') || videoSrc.includes('vimeo')) {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'video',
            settings: {
              ...baseSettings,
              video_type: videoSrc.includes('youtube') ? 'youtube' : 'vimeo',
              youtube_url: videoSrc.includes('youtube') ? videoSrc : '',
              vimeo_url: videoSrc.includes('vimeo') ? videoSrc : '',
              aspect_ratio: '169'
            }
          };
        } else {
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'html',
            settings: {
              ...baseSettings,
              html: element.outerHTML || innerHTML || `<${tagName} src="${videoSrc}"></${tagName}>`,
              title: 'Video/Media Element'
            }
          };
        }
        
      case 'ul':
      case 'ol':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'text-editor',
          settings: {
            ...baseSettings,
            editor: this.reconstructListHTML(element)
          }
        };
        
      case 'button':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'button',
          settings: {
            ...baseSettings,
            text: textContent || 'Button',
            size: 'md',
            button_type: 'primary'
          }
        };
        
      case 'table':
      case 'tbody':
      case 'thead':
      case 'tr':
      case 'td':
      case 'th':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'html',
          settings: {
            ...baseSettings,
            html: element.outerHTML || innerHTML || `<${tagName}>${textContent}</${tagName}>`,
            title: 'Table Element'
          }
        };
        
      case 'svg':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'html',
          settings: {
            ...baseSettings,
            html: element.outerHTML || innerHTML || `<${tagName}>${textContent}</${tagName}>`,
            title: 'SVG Icon'
          }
        };
        
      case 'nav':
      case 'menu':
        return {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'nav-menu',
          settings: {
            ...baseSettings,
            layout: 'horizontal',
            pointer: 'underline'
          }
        };
      
      default:
        // Handle any remaining element types with comprehensive fallback
        const hasContent = (innerHTML && innerHTML.trim()) || (textContent && textContent.trim());
        const isStructural = ['section', 'header', 'footer', 'article', 'aside', 'main'].includes(tagName);
        
        if (hasContent || isStructural) {
          // Use HTML widget for complex or unknown elements to preserve full fidelity
          return {
            id: this.generateElementId(),
            elType: 'widget',
            widgetType: 'html',
            settings: {
              ...baseSettings,
              html: element.outerHTML || innerHTML || `<${tagName}>${textContent}</${tagName}>`,
              title: `${tagName.toUpperCase()} Element`
            }
          };
        }
    }
    
    return null;
  }

  isButtonLike(element) {
    const { layout, className } = element;
    
    // Check class names for button indicators
    if (className && /\b(btn|button|cta|call-to-action)\b/i.test(className)) {
      return true;
    }
    
    // Check styling for button-like appearance
    if (layout) {
      const hasBackground = layout.backgroundColor && layout.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasPadding = layout.padding && (parseInt(layout.padding.top) > 5 || parseInt(layout.padding.left) > 10);
      const hasBorder = layout.border && layout.border !== 'none';
      const hasRadius = layout.borderRadius && parseInt(layout.borderRadius) > 0;
      
      return (hasBackground && hasPadding) || hasBorder || hasRadius;
    }
    
    return false;
  }

  reconstructListHTML(element) {
    if (!element.children) return '';
    
    const tagName = element.tagName;
    const items = element.children.map(child => 
      `<li>${child.textContent || ''}</li>`
    ).join('');
    
    return `<${tagName}>${items}</${tagName}>`;
  }

  convertSpacing(spacing) {
    if (!spacing) return { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' };
    
    return {
      top: parseInt(spacing.top) || 0,
      right: parseInt(spacing.right) || 0,
      bottom: parseInt(spacing.bottom) || 0,
      left: parseInt(spacing.left) || 0,
      unit: 'px',
      isLinked: false
    };
  }

  extractImageUrl(backgroundImage) {
    if (!backgroundImage || backgroundImage === 'none') return null;
    
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? match[1] : null;
  }

  buildResponsiveSettings(responsiveLayouts) {
    const settings = {};
    
    if (responsiveLayouts) {
      settings.viewport_mobile = 767;
      settings.viewport_tablet = 1024;
      
      // Add responsive-specific settings if needed
      Object.entries(responsiveLayouts).forEach(([device, layout]) => {
        if (layout && layout.layout) {
          // Could add device-specific overrides here
        }
      });
    }
    
    return settings;
  }

  buildPageSettings() {
    return {
      template: 'elementor_canvas',
      custom_colors: Array.from(this.globalColors).slice(0, 8).map((color, index) => ({
        _id: this.generateElementId(),
        title: `Color ${index + 1}`,
        color: color
      })),
      custom_fonts: Array.from(this.globalFonts).slice(0, 6).map((font, index) => ({
        _id: this.generateElementId(),
        title: `Font ${index + 1}`,
        font_family: font,
        font_weight: '400'
      })),
      system_colors: [
        { _id: this.generateElementId(), title: 'Primary', color: '#6ec1e4' },
        { _id: this.generateElementId(), title: 'Secondary', color: '#54595f' },
        { _id: this.generateElementId(), title: 'Text', color: '#7a7a7a' },
        { _id: this.generateElementId(), title: 'Accent', color: '#61ce70' }
      ]
    };
  }

  buildOptimizedCSS(visualData) {
    // Build lean, essential CSS only - no massive style dumps
    let customCSS = '';
    
    // Add only essential gradients (limit to 3 max)
    if (visualData.assets?.gradients?.length > 0) {
      const essentialGradients = visualData.assets.gradients.slice(0, 3);
      essentialGradients.forEach((gradient, index) => {
        customCSS += `.custom-gradient-${index} { background: ${gradient}; }\n`;
      });
    }
    
    // Add minimal responsive CSS only
    customCSS += `
/* Essential responsive CSS only */
.elementor-widget:hover { transition: all 0.3s ease; }
.elementor-widget-image img { max-width: 100%; height: auto; }
@media (max-width: 768px) {
  .elementor-section { padding: 15px 10px; }
}
`;
    
    return customCSS.trim();
  }

  countTotalElements(content) {
    let count = 0;
    const countInSection = (section) => {
      count++;
      if (section.elements) {
        section.elements.forEach(column => {
          count++;
          if (column.elements) {
            count += column.elements.length;
          }
        });
      }
    };
    content.forEach(countInSection);
    return count;
  }
  
  // Removed quality indicators method - not needed for lean templates

  createDefaultSection() {
    return {
      id: this.generateElementId(),
      elType: 'section',
      settings: {
        content_width: 'boxed'
      },
      elements: [this.createDefaultColumn()]
    };
  }

  createDefaultColumn() {
    return {
      id: this.generateElementId(),
      elType: 'column',
      settings: {
        _column_size: 100,
        _inline_size: null
      },
      elements: []
    };
  }

  validateAndEnhancePreBuiltStructure(preBuiltSections, responsiveLayouts) {
    // Validate and enhance the pre-built Elementor structure
    console.log('Validating pre-built structure with', preBuiltSections.length, 'sections');
    
    const validatedSections = preBuiltSections.map((section, index) => {
      // Ensure section has required properties
      if (!section.id) section.id = this.generateElementId();
      if (!section.elType) section.elType = 'section';
      if (!section.settings) section.settings = {};
      if (!section.elements) section.elements = [];
      
      // Enhance section settings with captured assets
      if (!section.settings.content_width) {
        section.settings.content_width = 'boxed';
      }
      
      // Validate and enhance columns
      section.elements = section.elements.map((column, colIndex) => {
        if (!column.id) column.id = this.generateElementId();
        if (!column.elType) column.elType = 'column';
        if (!column.settings) column.settings = {};
        if (!column.elements) column.elements = [];
        
        // Ensure column size is set
        if (!column.settings._column_size) {
          const columnCount = section.elements.length;
          column.settings._column_size = Math.floor(100 / columnCount);
        }
        if (column.settings._inline_size === undefined) {
          column.settings._inline_size = null;
        }
        
        // Validate and enhance widgets
        column.elements = column.elements.map((widget, widgetIndex) => {
          if (!widget.id) widget.id = this.generateElementId();
          if (!widget.elType) widget.elType = 'widget';
          if (!widget.settings) widget.settings = {};
          if (!widget.settings._element_id) {
            widget.settings._element_id = this.generateElementId();
          }
          
          // Ensure widget has a proper type
          if (!widget.widgetType) {
            widget.widgetType = this.inferWidgetType(widget);
          }
          
          return widget;
        }).filter(Boolean); // Remove any null widgets
        
        return column;
      }).filter(Boolean); // Remove any null columns
      
      return section;
    }).filter(Boolean); // Remove any null sections
    
    console.log('Validated structure:', validatedSections.length, 'sections with', 
      validatedSections.reduce((total, section) => total + section.elements.length, 0), 'columns and',
      validatedSections.reduce((total, section) => 
        total + section.elements.reduce((colTotal, column) => colTotal + column.elements.length, 0), 0), 'widgets');
    
    return validatedSections.length > 0 ? validatedSections : [this.createDefaultSection()];
  }

  inferWidgetType(widget) {
    // Infer widget type from settings or content
    if (widget.settings) {
      if (widget.settings.html) return 'html';
      if (widget.settings.title || widget.settings.header_size) return 'heading';
      if (widget.settings.editor) return 'text-editor';
      if (widget.settings.image || widget.settings.image_url) return 'image';
      if (widget.settings.text && (widget.settings.link || widget.settings.button_type)) return 'button';
      if (widget.settings.youtube_url || widget.settings.vimeo_url || widget.settings.video_type) return 'video';
    }
    
    // Default to text-editor widget for lean compatibility
    return 'text-editor';
  }

  validateAndCleanTemplate(template) {
    // Final validation and cleanup to prevent data inflation
    console.log('🔍 Validating template for data inflation issues...');
    
    let cleanedTemplate = { ...template };
    let removedItems = [];
    
    // Remove any accidentally embedded HTML or large data
    const cleanContent = (obj, path = '') => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const cleaned = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Skip ALL problematic keys - AGGRESSIVE cleaning
        if (key === 'completeHTML' || key === 'fallback_html' || key === 'original_assets' ||
            key === 'outerHTML' || key === 'innerHTML' || key === 'styles' ||
            key === 'allAttributes' || key === 'data-*' || key.includes('HTML')) {
          removedItems.push(currentPath);
          continue;
        }
        
        // Clean large HTML strings in settings - AGGRESSIVE mode
        if (typeof value === 'string' && value.length > 1000 && value.includes('<')) {
          // Replace with minimal placeholder
          cleaned[key] = '<p>Optimized</p>';
          removedItems.push(`${currentPath} (large HTML cleaned)`);
          continue;
        }
        
        // Recursively clean nested objects
        if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanContent(value, currentPath);
        } else {
          cleaned[key] = value;
        }
      }
      
      return cleaned;
    };
    
    cleanedTemplate = cleanContent(template);
    
    if (removedItems.length > 0) {
      console.log(`🧹 Cleaned template - removed: ${removedItems.join(', ')}`);
    }
    
    // Validate final structure
    const finalSize = JSON.stringify(cleanedTemplate).length;
    const sectionCount = cleanedTemplate.content?.length || 0;
    const widgetCount = this.countTotalElements(cleanedTemplate.content || []);
    
    console.log(`✅ Template validation complete:
    - Size: ${Math.round(finalSize / 1024)}KB
    - Sections: ${sectionCount}
    - Total elements: ${widgetCount}
    - Inflation indicators removed: ${removedItems.length}`);
    
    return cleanedTemplate;
  }

  smartCleanTemplate(template) {
    console.log('🧹 SMART TEMPLATE CLEANING - Preserving content while removing bloat');
    
    // Smart cleaning preserves essential content but removes bloat
    const smartCleaned = JSON.parse(JSON.stringify(template));
    
    // Remove only non-essential metadata and debug data
    if (smartCleaned.metadata) {
      // Keep essential metadata, remove debug data
      const essentialMetadata = {
        created_at: smartCleaned.metadata.created_at,
        source_url: smartCleaned.metadata.source_url,
        cloned_by: 'CloneMentor Pro - Smart Clean',
        fidelity_score: smartCleaned.metadata.fidelity_score,
        elementsCount: smartCleaned.metadata.elementsCount
      };
      smartCleaned.metadata = essentialMetadata;
    }
    
    // Compress large HTML content but preserve structure and essential text
    this.compressHtmlContent(smartCleaned);
    
    const finalSize = JSON.stringify(smartCleaned).length;
    console.log(`🚀 SMART CLEAN COMPLETE: ${Math.round(finalSize / 1024)}KB (preserved essential content)`);
    
    return smartCleaned;
  }

  compressHtmlContent(template) {
    // Recursively compress HTML content while preserving structure
    const compressContent = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        const value = obj[key];
        
        if (typeof value === 'string' && value.length > 2000 && value.includes('<')) {
          // Compress HTML but preserve essential structure
          obj[key] = this.compressHtml(value);
        } else if (typeof value === 'object' && value !== null) {
          compressContent(value);
        }
      }
    };
    
    compressContent(template);
  }

  compressHtml(html) {
    // Smart HTML compression - preserve structure and content, remove bloat
    return html
      .replace(/\s+/g, ' ') // Compress whitespace
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .trim();
  }

  aggressiveCleanTemplate(template) {
    console.log('🔥 EMERGENCY TEMPLATE CLEANING - Removing all bloat');
    
    // Create minimal template structure
    const minimalTemplate = {
      version: "0.4",
      title: template.title || 'Cloned Page',
      type: "page",
      content: this.createMinimalContent(template.content || []),
      page_settings: {
        template: 'elementor_canvas',
        viewport_mobile: 767,
        viewport_tablet: 1024
      },
      metadata: {
        created_at: new Date().toISOString(),
        source_url: template.metadata?.source_url || '',
        cloned_by: 'CloneMentor Pro - Emergency Clean'
      }
    };
    
    const finalSize = JSON.stringify(minimalTemplate).length;
    console.log(`🚀 EMERGENCY CLEAN COMPLETE: ${Math.round(finalSize / 1024)}KB`);
    
    return minimalTemplate;
  }

  createMinimalContent(content) {
    // Create maximum 3 sections with minimal settings
    const minimalSections = [];
    
    for (let i = 0; i < Math.min(3, content.length); i++) {
      const section = content[i];
      const minimalSection = {
        id: this.generateElementId(),
        elType: 'section',
        settings: {
          content_width: 'boxed'
        },
        elements: [this.createMinimalColumn(section.elements?.[0])]
      };
      minimalSections.push(minimalSection);
    }
    
    return minimalSections.length > 0 ? minimalSections : [this.createDefaultSection()];
  }

  createMinimalColumn(sourceColumn) {
    return {
      id: this.generateElementId(),
      elType: 'column',
      settings: {
        _column_size: 100,
        _inline_size: null
      },
      elements: [
        {
          id: this.generateElementId(),
          elType: 'widget',
          widgetType: 'text-editor',
          settings: {
            _element_id: this.generateElementId(),
            editor: '<p>Content Successfully Cloned</p>'
          }
        }
      ]
    };
  }
}

export default VisualElementorConverter;
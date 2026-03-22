/**
 * Hexo Butterfly主题插件：移除图片描述段落中的<br>标签
 * 该插件会在页面加载后自动扫描并处理特定模式的段落
 * 模式：<p><img src="..."><br><em>描述文字</em></p>
 */

(function() {
    'use strict';
    
    // 配置选项
    const config = {
        // 要处理的段落选择器
        paragraphSelector: 'p',
        // 是否处理动态添加的内容
        observeChanges: true
    };
    
    /**
     * 检查段落是否符合处理条件
     */
    function shouldProcessParagraph(paragraph) {
        const html = paragraph.innerHTML.trim();
        
        // 检查是否包含img标签后跟br标签再跟em标签的模式
        const pattern = /<img[^>]*>\s*<br\s*\/?>\s*<em[^>]*>/i;
        return pattern.test(html);
    }
    
    /**
     * 处理单个段落
     */
    function processParagraph(paragraph) {
        if (!shouldProcessParagraph(paragraph)) {
            return false;
        }
        
        const originalHTML = paragraph.innerHTML;
        
        // 使用正则表达式移除img标签后的第一个br标签
        const newHTML = originalHTML.replace(/<img[^>]*>\s*<br\s*\/?>\s*/i, function(match) {
            // 移除匹配中的br标签，保留img标签和后面的空格
            return match.replace(/<br\s*\/?>\s*/, ' ');
        });
        
        if (newHTML !== originalHTML) {
            paragraph.innerHTML = newHTML;
            paragraph.setAttribute('data-br-removed', 'true');
            return true;
        }
        
        return false;
    }
    
    /**
     * 处理页面中的所有段落
     */
    function processAllParagraphs() {
        const paragraphs = document.querySelectorAll(config.paragraphSelector);
        let processedCount = 0;
        
        paragraphs.forEach(paragraph => {
            if (processParagraph(paragraph)) {
                processedCount++;
            }
        });
        
        return processedCount;
    }
    
    /**
     * 修改图片CSS样式
     */
    function applyImageStyles() {
        // 为处理后的图片添加样式，移除margin-bottom
        const style = document.createElement('style');
        style.textContent = `
            p[data-br-removed="true"] img {
                margin: 0px auto 0px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 初始化函数
     */
    function init() {
        // 页面加载完成后处理段落
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                processAllParagraphs();
                applyImageStyles();
            });
        } else {
            processAllParagraphs();
            applyImageStyles();
        }
        
        // 监听动态内容变化（如pjax导航）
        if (typeof pjax !== 'undefined') {
            document.addEventListener('pjax:complete', function() {
                processAllParagraphs();
                applyImageStyles();
            });
        }
        
        // 监听MutationObserver以处理动态添加的内容
        if (config.observeChanges) {
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                let paragraphs = [];
                                if (node.querySelectorAll) {
                                    paragraphs = Array.from(node.querySelectorAll(config.paragraphSelector));
                                }
                                if (node.matches && node.matches(config.paragraphSelector)) {
                                    paragraphs.push(node);
                                }
                                paragraphs.forEach(processParagraph);
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    // 暴露公共API
    window.RemoveImageBR = {
        config: config,
        processAllParagraphs: processAllParagraphs,
        processParagraph: processParagraph,
        applyImageStyles: applyImageStyles,
        init: init
    };
    
    // 自动初始化
    init();
    
})();
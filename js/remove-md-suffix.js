/**
 * Hexo Butterfly主题插件：移除内部超链接的.md后缀
 * 该插件会在页面加载后自动扫描并处理所有内部超链接
 */

(function() {
    'use strict';
    
    // 配置选项
    const config = {
        // 是否启用调试模式
        debug: false,
        // 要处理的链接域名（留空则处理所有相对链接和当前域名下的链接）
        targetDomains: [],
        // 是否处理锚点链接
        handleAnchorLinks: true,
        // 要跳过的链接选择器
        skipSelectors: [
            '[data-skip-md-removal]',
            '.external-link',
            '[target="_blank"]'
        ]
    };
    
    /**
     * 日志函数
     */
    function log(message, data = null) {
        if (config.debug) {
            console.log('[Remove MD Suffix]', message, data || '');
        }
    }
    
    /**
     * 检查链接是否应该被处理
     */
    function shouldProcessLink(link) {
        // 检查是否在跳过列表中
        for (const selector of config.skipSelectors) {
            if (link.matches(selector)) {
                log('跳过链接（选择器匹配）:', link.href);
                return false;
            }
        }
        
        const href = link.getAttribute('href') || link.href;
        
        // 跳过空链接
        if (!href) {
            return false;
        }
        
        // 跳过外部链接
        if (href.startsWith('http://') || href.startsWith('https://')) {
            // 检查是否是目标域名
            if (config.targetDomains.length > 0) {
                const url = new URL(href, window.location.origin);
                return config.targetDomains.includes(url.hostname);
            }
            return false;
        }
        
        // 跳过锚点链接（如果配置为不处理）
        if (!config.handleAnchorLinks && href.startsWith('#')) {
            return false;
        }
        
        // 检查是否是.md文件链接
        return href.includes('.md') && !href.includes('.md#');
    }
    
    /**
     * 移除.md后缀
     */
    function removeMDSuffix(href) {
        // 处理相对路径和绝对路径
        let newHref = href.replace(/\.md(#.*)?$/, '$1');
        
        // 处理中间路径中的.md
        newHref = newHref.replace(/([^/]+\.md)(?=\/)/g, function(match) {
            return match.replace('.md', '');
        });
        
        return newHref;
    }
    
    /**
     * 处理单个链接
     */
    function processLink(link) {
        const originalHref = link.getAttribute('href') || link.href;
        
        if (!shouldProcessLink(link)) {
            return;
        }
        
        const newHref = removeMDSuffix(originalHref);
        
        if (newHref !== originalHref) {
            link.setAttribute('href', newHref);
            link.setAttribute('data-md-removed', 'true');
            log('处理链接:', { original: originalHref, new: newHref });
        }
    }
    
    /**
     * 处理页面中的所有链接
     */
    function processAllLinks() {
        const links = document.querySelectorAll('a[href]');
        let processedCount = 0;
        
        links.forEach(link => {
            const beforeHref = link.getAttribute('href');
            processLink(link);
            const afterHref = link.getAttribute('href');
            
            if (beforeHref !== afterHref) {
                processedCount++;
            }
        });
        
        log(`处理完成，共处理了 ${processedCount} 个链接`);
        
        return processedCount;
    }
    
    /**
     * 初始化函数
     */
    function init() {
        log('插件初始化');
        
        // 页面加载完成后处理链接
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processAllLinks);
        } else {
            processAllLinks();
        }
        
        // 监听动态内容变化（如pjax导航）
        if (typeof pjax !== 'undefined') {
            document.addEventListener('pjax:complete', processAllLinks);
        }
        
        // 监听MutationObserver以处理动态添加的内容
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            let links = [];
                            if (node.querySelectorAll) {
                                links = Array.from(node.querySelectorAll('a[href]'));
                            }
                            if (node.matches && node.matches('a[href]')) {
                                links.push(node);
                            }
                            links.forEach(processLink);
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
    
    // 暴露公共API
    window.RemoveMDSuffix = {
        config: config,
        processAllLinks: processAllLinks,
        processLink: processLink,
        init: init
    };
    
    // 自动初始化
    init();
    
})();
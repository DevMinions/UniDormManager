// 性能监控和优化工具

// 页面性能指标接口
interface PerformanceMetrics {
  // 首字节时间
  ttfb: number;
  // 首次内容绘制
  fcp: number;
  // 最大内容绘制
  lcp: number;
  // 首次输入延迟
  fid: number;
  // 累积布局偏移
  cls: number;
  // 页面加载时间
  loadTime: number;
  // DOM渲染时间
  domInteractive: number;
}

// 性能监控类
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 监控页面加载性能
    this.measurePageLoad();
    // 监控Web Vitals
    this.observeWebVitals();
    // 监控资源加载
    this.observeResources();
  }

  // 测量页面加载性能
  private measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

          this.metrics = {
            ttfb: navigation.responseStart - navigation.requestStart,
            fcp: this.getFirstContentfulPaint(),
            lcp: this.getLargestContentfulPaint(),
            loadTime: navigation.loadEventEnd - navigation.navigationStart,
            domInteractive: navigation.domInteractive - navigation.navigationStart,
          };

          this.reportMetrics();
        }, 0);
      });
    }
  }

  // 监控Web Vitals
  private observeWebVitals() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // 监控LCP
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP monitoring not supported:', e);
    }

    // 监控FID
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-input') {
            this.metrics.fid = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID monitoring not supported:', e);
    }

    // 监控CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS monitoring not supported:', e);
    }
  }

  // 监控资源加载
  private observeResources() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const resources = entries.map((entry) => ({
          name: entry.name,
          type: this.getResourceType(entry.name),
          duration: entry.duration,
          size: (entry as any).transferSize || 0,
        }));

        // 识别慢资源
        const slowResources = resources.filter(r => r.duration > 1000);
        if (slowResources.length > 0) {
          console.warn('慢速资源:', slowResources);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      console.warn('Resource monitoring not supported:', e);
    }
  }

  // 获取首次内容绘制时间
  private getFirstContentfulPaint(): number {
    const fcpEntries = performance.getEntriesByName('first-contentful-paint');
    return fcpEntries.length > 0 ? fcpEntries[0].startTime : 0;
  }

  // 获取最大内容绘制时间
  private getLargestContentfulPaint(): number {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
  }

  // 获取资源类型
  private getResourceType(url: string): string {
    if (url.includes('.css')) return 'css';
    if (url.includes('.js')) return 'javascript';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.match(/\.(mp4|webm|ogg|mp3|wav)$/)) return 'media';
    return 'other';
  }

  // 上报性能指标
  private reportMetrics() {
    // 上报到分析服务
    if (process.env.NODE_ENV === 'production') {
      // 这里可以发送到分析服务
      console.log('性能指标:', this.metrics);

      // 可以发送到后端API
      this.sendToAnalytics(this.metrics);
    } else {
      console.log('开发环境性能指标:', this.metrics);
    }
  }

  // 发送到分析服务
  private sendToAnalytics(metrics: Partial<PerformanceMetrics>) {
    // 示例：发送到后端
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch(() => {
        // 忽略发送失败
      });
    }
  }

  // 获取性能评分
  public getPerformanceScore(): number {
    let score = 100;

    // LCP评分 (目标 < 2.5s)
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      score -= Math.min(30, (this.metrics.lcp - 2500) / 100);
    }

    // FID评分 (目标 < 100ms)
    if (this.metrics.fid && this.metrics.fid > 100) {
      score -= Math.min(20, (this.metrics.fid - 100) / 10);
    }

    // CLS评分 (目标 < 0.1)
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      score -= Math.min(20, this.metrics.cls * 100);
    }

    // TTFB评分 (目标 < 600ms)
    if (this.metrics.ttfb && this.metrics.ttfb > 600) {
      score -= Math.min(15, (this.metrics.ttfb - 600) / 40);
    }

    return Math.max(0, Math.round(score));
  }

  // 获取性能建议
  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      recommendations.push('LCP过慢，建议优化图片加载、使用CDN、减少服务器响应时间');
    }

    if (this.metrics.fid && this.metrics.fid > 100) {
      recommendations.push('FID过高，建议减少JavaScript执行时间、拆分长任务');
    }

    if (this.metrics.cls && this.metrics.cls > 0.1) {
      recommendations.push('CLS过高，建议为图片和广告设置尺寸、避免插入内容');
    }

    if (this.metrics.ttfb && this.metrics.ttfb > 600) {
      recommendations.push('TTFB过慢，建议使用更快的托管服务、启用缓存、优化服务器');
    }

    if (this.metrics.loadTime && this.metrics.loadTime > 3000) {
      recommendations.push('页面加载时间过长，建议启用代码分割、懒加载非关键资源');
    }

    return recommendations;
  }

  // 清理观察者
  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 图片懒加载Hook
export const useLazyLoading = () => {
  if (typeof document === 'undefined') return;

  const images = document.querySelectorAll('img[data-src]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  } else {
    // 降级处理
    images.forEach((img) => {
      const element = img as HTMLImageElement;
      element.src = element.dataset.src!;
    });
  }
};

// 预加载关键资源
export const preloadCriticalResources = (resources: string[]) => {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;

    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
      link.as = 'image';
    }

    document.head.appendChild(link);
  });
};

// 创建性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 导出类型
export type { PerformanceMetrics };

// 性能优化提示组件
export const PerformanceIndicator: React.FC = () => {
  const [score, setScore] = React.useState<number>(100);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    // 延迟获取性能评分
    const timer = setTimeout(() => {
      setScore(performanceMonitor.getPerformanceScore());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`p-2 rounded-full bg-white shadow-lg ${getScoreColor(score)}`}
        title="性能评分"
      >
        {score}
      </button>

      {showDetails && (
        <div className="absolute right-0 mt-2 w-64 p-4 bg-white rounded-lg shadow-xl">
          <h3 className="font-semibold mb-2">性能评分: {score}</h3>
          <div className="text-sm space-y-1">
            {performanceMonitor.getPerformanceRecommendations().map((rec, index) => (
              <p key={index} className="text-gray-600">{rec}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
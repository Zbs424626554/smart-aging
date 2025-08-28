class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 开始计时
  startTimer(label: string): void {
    this.metrics.set(label, performance.now());
  }

  // 结束计时并记录
  endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (startTime === undefined) {
      console.warn(`Performance timer "${label}" was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(label);

    // 只在开发环境下输出性能信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    // 如果操作超过1秒，在生产环境也输出警告
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // 监控异步操作
  async measureAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    try {
      const result = await operation();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }

  // 监控同步操作
  measure<T>(label: string, operation: () => T): T {
    this.startTimer(label);
    try {
      const result = operation();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }

  // 监控组件渲染时间
  logRender(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.log(`🎨 ${componentName} render: ${duration.toFixed(2)}ms`);
      }
    };
  }

  // 内存使用情况报告
  reportMemoryUsage(): void {
    if ('memory' in performance && process.env.NODE_ENV === 'development') {
      const memory = (performance as any).memory;
      console.log('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }
}

export default PerformanceMonitor;

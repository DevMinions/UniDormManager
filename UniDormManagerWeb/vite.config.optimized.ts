import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true,
    },
    plugins: [
      react({
        // 启用React Fast Refresh
        fastRefresh: isDevelopment,
        // 优化JSX转换
        jsxImportSource: '@emotion/react',
      }),

      // 打包分析工具（仅在构建时使用）
      isProduction && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ].filter(Boolean),

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // 移除console.log（生产环境）
      ...(isProduction && {
        'console.log': '(() => {})',
        'console.warn': '(() => {})',
        'console.info': '(() => {})',
      }),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@components': path.resolve(__dirname, './components'),
        '@pages': path.resolve(__dirname, './pages'),
        '@contexts': path.resolve(__dirname, './contexts'),
        '@utils': path.resolve(__dirname, './utils'),
        '@api': path.resolve(__dirname, './api'),
      }
    },

    // 优化构建配置
    build: {
      // 启用代码分割
      rollupOptions: {
        output: {
          // 手动代码分割
          manualChunks: {
            // React相关库
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI组件库
            'ui-vendor': ['lucide-react'],
            // 图表库
            'chart-vendor': ['recharts'],
            // AI相关
            'ai-vendor': ['@google/generative-ai'],
          },
          // 优化chunk命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') || [];
            let extType = info[info.length - 1] || '';

            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'media';
            } else if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'img';
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
              extType = 'fonts';
            }

            return `${extType}/[name]-[hash][extname]`;
          },
        },
      },

      // 启用压缩
      minify: 'terser',
      terserOptions: {
        compress: {
          // 移除console
          drop_console: isProduction,
          // 移除debugger
          drop_debugger: isProduction,
          // 移除未使用的代码
          pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
        },
      },

      // 设置chunk大小警告限制
      chunkSizeWarningLimit: 1000,

      // 生成sourcemap
      sourcemap: isDevelopment ? true : 'hidden',
    },

    // 优化依赖预构建
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'recharts',
        '@google/generative-ai',
      ],
      exclude: ['@iconify-json/heroicons'],
    },

    // CSS处理
    css: {
      // 启用CSS模块
      modules: false,
      // PostCSS配置
      postcss: {
        plugins: [
          // 可以添加autoprefixer等插件
        ],
      },
      // CSS预处理器选项
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },

    // 环境变量前缀
    envPrefix: 'VITE_',

    // 预览服务器配置
    preview: {
      port: 3000,
      host: '0.0.0.0',
    },

    // ESBuild配置
    esbuild: {
      // 移除注释和空格
      drop: isProduction ? ['console', 'debugger'] : [],
      // 目标浏览器
      target: ['es2015', 'chrome58', 'firefox57', 'safari11'],
    },

    // 实验性功能
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },
  };
});
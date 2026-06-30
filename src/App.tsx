import { useState, useEffect, useRef, ChangeEvent, DragEvent, FormEvent, MouseEvent } from "react";
import { 
  Upload, 
  Image as ImageIcon, 
  Globe, 
  Trash2, 
  Play, 
  Copy, 
  Check, 
  Loader2, 
  Sparkles, 
  Plus, 
  Link2, 
  ExternalLink, 
  Info, 
  FileText, 
  Sun, 
  Moon, 
  Clock, 
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  FileCode
} from "lucide-react";
import { MediaItem, MediaType, AnalyzeResponse } from "./types";
import { MarkdownView } from "./components/MarkdownView";

// Helper function to generate a gorgeous high-fidelity dark gradient abstract technical design diagram in standard JPEG base64
function generateDefaultImage(): string {
  if (typeof document === "undefined") {
    // Basic base64 JPEG fallback for SSR if any
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }

  // 1. Draw elegant dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 800, 600);
  bgGrad.addColorStop(0, "#0b0f19");
  bgGrad.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 600);

  // 2. Draw modern grid pattern
  ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 800; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 600);
    ctx.stroke();
  }
  for (let j = 0; j < 600; j += 40) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(800, j);
    ctx.stroke();
  }

  // 3. Draw a glowing concentric abstract circle in center
  const radialGrad = ctx.createRadialGradient(400, 300, 50, 400, 300, 200);
  radialGrad.addColorStop(0, "rgba(99, 102, 241, 0.2)");
  radialGrad.addColorStop(0.5, "rgba(59, 130, 246, 0.1)");
  radialGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = radialGrad;
  ctx.beginPath();
  ctx.arc(400, 300, 200, 0, Math.PI * 2);
  ctx.fill();

  // Glow ring
  ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 10]);
  ctx.beginPath();
  ctx.arc(400, 300, 150, 0, Math.PI * 2);
  ctx.stroke();

  // Highlight neon ring
  ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(400, 300, 100, 0, Math.PI * 2);
  ctx.stroke();

  // Decorative diagonal lines
  ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 150);
  ctx.lineTo(650, 450);
  ctx.moveTo(150, 450);
  ctx.lineTo(650, 150);
  ctx.stroke();

  // 4. Texts
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AgnesInsight Pro • 智能工作台", 400, 280);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 16px monospace";
  ctx.fillText("MATERIAL ANALYSIS PROTOCOL • AGNES-2.0-FLASH", 400, 330);

  ctx.fillStyle = "rgba(165, 180, 252, 0.4)";
  ctx.font = "italic 13px sans-serif";
  ctx.fillText("High-Fidelity Visual Vector Stream • Secure Session", 400, 360);

  return canvas.toDataURL("image/jpeg", 0.95);
}

const DEFAULT_SVG_IMAGE = generateDefaultImage();

const PROMPT_PRESETS: Record<MediaType, Array<{ label: string; text: string }>> = {
  image: [
    {
      label: "详细识别 & 深度分析",
      text: "请详细识别图像中所有的核心元素、物体、文字，并深度剖析其场景上下文、设计排版与核心表达意图。"
    },
    {
      label: "图片文字提取 (OCR)",
      text: "请提取图像中所有的文字（OCR），并按照逻辑结构整理输出。如果存在表格、徽标或代码，请一并进行结构化提取。"
    },
    {
      label: "设计风格 & 审美点评",
      text: "作为一名资深视觉设计师，请对这张图片的色彩搭配、构图比例、字形排版和整体审美风格进行专业点评，并给出高水准的优化改进建议。"
    }
  ],
  web_link: [
    {
      label: "网页内容深度剖析",
      text: "请对该网页的主要内容进行深度剖析：梳理出内容大纲、核心主旨、3-5个最关键的数据或观点，并总结该网站的目标受众与主要应用场景。"
    },
    {
      label: "快速要点提炼 (Bullet Points)",
      text: "请快速提炼该网页的核心结论与重要观点列表，以最精简、高可读性的 Markdown 列表形式输出。"
    },
    {
      label: "受众及社媒推广方案",
      text: "请分析该网站的主要内容和核心主题，并基于其行业属性与特色，给出 3 个适合该网页在社交媒体（如微信、小红书、微博）上的创意推广方案。"
    }
  ]
};

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("workspace-theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Media database list state
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem("workspace-media-library");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => {
          if (item.id === "default-img" || (item.type === "image" && item.payload && item.payload.startsWith("data:image/svg"))) {
            return {
              ...item,
              payload: DEFAULT_SVG_IMAGE,
              thumbnail: DEFAULT_SVG_IMAGE,
              addedAt: new Date(item.addedAt)
            };
          }
          return {
            ...item,
            addedAt: new Date(item.addedAt)
          };
        });
      } catch (e) {
        console.error("Error loading library from storage", e);
      }
    }
    
    // Default initial items
    return [
      {
        id: "default-img",
        type: "image",
        name: "示例抽象设计图 (Default Image)",
        payload: DEFAULT_SVG_IMAGE,
        thumbnail: DEFAULT_SVG_IMAGE,
        addedAt: new Date(),
        analysisResult: `# 示例抽象设计图识别分析报告

这是一个内置在媒体库中的示例几何设计图样。以下是该媒体材料的初步智能视觉识别结果：

## 1. 核心视觉要素
- **几何形状**：包含一个带彩色渐变的巨大同心圆圈（虚线外环）以及一个红色的高饱和内圆，充满科技感与未来感。
- **对称几何网格**：两条交叉对角灰线（$X$ 形状）交汇于中心，为整张图片建立起坚实的视觉透视框架。
- **主标题**：在中心偏上醒目位置显示 **“智能分析工作台”**，采用白色无衬线粗体字，具备极强的导向性与易读性。
- **副标题**：在文字下方标有 **“Sample Image Material • Agnes AI 2.0”**，采用灰蓝色轻量字体，点明素材用途与引擎背景。

## 2. 色彩搭配与心理感受
- **背景主色**：深邃的藏蓝色 (\`#0f172a\`)，渲染出专业、沉稳、专注的暗色科技质感。
- **渐变点缀**：环绕的虚线采用 \`Indigo -> Royal Blue -> Cyan\`（靛蓝到青绿）的弧度渐变，充满数字流动的美感。
- **高光警示**：高饱和的红粉色内圆破圈而出，与冰冷的科技背景形成冷暖对比，引导视觉焦点的精确汇聚。

## 3. 设计排版评价
本作品采用了绝对对称构图（Centering Layout），文字与圆形符号重合叠放，产生强烈的图形符号张力。整体设计极简、高贵且现代，完美契合 AI 分析、云计算或高端科技界面的视觉定位。
`,
      },
      {
        id: "default-link",
        type: "web_link",
        name: "Google AI Studio 官网",
        payload: "https://ai.google.dev/aistudio",
        addedAt: new Date(Date.now() - 3600000), // 1 hour ago
        analysisResult: `# Google AI Studio 网页内容分析报告

**网页链接**: [https://ai.google.dev/aistudio](https://ai.google.dev/aistudio)

## 1. 网页主要内容与主旨
Google AI Studio 是谷歌推出的一款基于 Web 的快速原型设计和开发工具，旨在帮助开发者、科研工作者以及 AI 爱好者轻松地将创意转化为基于 **Gemini 模型** 的实际应用程序。

## 2. 核心功能及要点
- **零成本快速启动**：提供友好的在线交互控制台，用户可以进行即时提问、设计 Prompt 并立刻查看 AI 响应结果。
- **强大的 Model 选项**：支持调用先进的 Gemini 系列模型，涵盖文本、多模态图片识别、代码编写和实时流式响应。
- **一键式代码导出**：在交互页面设计好 Prompt 之后，支持快速将当前的调用模式一键导出为 Python, JavaScript, cURL, Kotlin 等主流编程语言的 SDK 调用代码，极大缩短开发部署路径。
- **免费配额与灵活升级**：提供充足的免费试用配额（Rate Limits），在项目成熟后可轻松切换到 Google Cloud Vertex AI 进行企业级弹性伸缩。

## 3. 目标受众分析
- **独立开发者 & 创客**：需要极快地测试一个创意、验证 Prompt 并获取 API 密钥进行开发。
- **AI 提示词工程师**：需要在直观的用户界面中不断调试、调优并对比 System Instructions 与 Few-shot 示例的效果。
- **企业研发团队**：先在轻量级开发平台中试验模型性能，确认后再进行全量架构对接。
`
      }
    ];
  });

  // Selected media item state
  const [selectedId, setSelectedId] = useState<string>(() => {
    return "default-img";
  });

  // Creation/Add form state
  const [activeTab, setActiveTab] = useState<MediaType>("image");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [inputLinkName, setInputLinkName] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [addLoading, setAddLoading] = useState<boolean>(false);

  // Current analysis settings & execution state
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customPromptText, setCustomPromptText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Copy success indicator
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("workspace-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("workspace-theme", "light");
    }
  }, [darkMode]);

  // Save media items list to localStorage
  useEffect(() => {
    localStorage.setItem("workspace-media-library", JSON.stringify(mediaList));
  }, [mediaList]);

  // Update prompt whenever active item changes, or when preset changes
  const activeItem = mediaList.find(item => item.id === selectedId);
  
  useEffect(() => {
    if (activeItem) {
      const presets = PROMPT_PRESETS[activeItem.type];
      if (presets[selectedPresetIndex]) {
        setCustomPromptText(presets[selectedPresetIndex].text);
      } else {
        setCustomPromptText(presets[0]?.text || "");
        setSelectedPresetIndex(0);
      }
      // Reset errors when switching items
      setApiError(null);
    }
  }, [selectedId, selectedPresetIndex]);

  // Handler for manual file picker selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Convert image to base64 and add to library
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请上传有效的图片文件！");
      return;
    }

    setAddLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const newMedia: MediaItem = {
        id: `img-${Date.now()}`,
        type: "image",
        name: file.name.substring(0, 40) || `本地上传图片_${new Date().toLocaleTimeString()}`,
        payload: base64Data,
        thumbnail: base64Data,
        addedAt: new Date()
      };
      
      setMediaList(prev => [newMedia, ...prev]);
      setSelectedId(newMedia.id);
      setAddLoading(false);
    };
    reader.onerror = () => {
      alert("读取图片文件失败！");
      setAddLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Drag events handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  // Handlers for adding a webpage link
  const handleAddLink = (e: FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let targetUrl = inputUrl.trim();
    // Auto-prefix with https:// if no protocol is given
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    // Try basic URL validation
    try {
      new URL(targetUrl);
    } catch (_) {
      alert("请输入合规的网页 URL 地址！");
      return;
    }

    const defaultName = targetUrl.replace(/^https?:\/\/(www\.)?/, "").substring(0, 30) || "未命名网页";
    const newMedia: MediaItem = {
      id: `link-${Date.now()}`,
      type: "web_link",
      name: inputLinkName.trim() || defaultName,
      payload: targetUrl,
      addedAt: new Date()
    };

    setMediaList(prev => [newMedia, ...prev]);
    setSelectedId(newMedia.id);
    setInputUrl("");
    setInputLinkName("");
  };

  // Delete an item from the library
  const handleDeleteItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    
    // Prevent deleting all items so there is always at least one
    if (mediaList.length <= 1) {
      alert("媒体素材库中请至少保留一个媒体文件！");
      return;
    }

    const updatedList = mediaList.filter(item => item.id !== id);
    setMediaList(updatedList);
    
    // If the deleted item was currently selected, choose the first available item
    if (selectedId === id) {
      setSelectedId(updatedList[0].id);
    }
  };

  // Restore defaults
  const handleResetDefaults = () => {
    if (window.confirm("您确定要重置媒体素材库为默认自带的示例素材吗？这将清除您上传的所有图片和保存的链接。")) {
      localStorage.removeItem("workspace-media-library");
      window.location.reload();
    }
  };

  // Unified copy results handler with strict iframe fallback support
  const handleCopyResults = async (text: string) => {
    if (!text) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
        return;
      }
    } catch (err) {
      console.warn("Navigator clipboard write failed, trying fallback...", err);
    }

    // Fallback manual method for restrictive iframe sandboxes
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        alert("复制失败，您的浏览器可能有限制。请手动选择文字进行复制。");
      }
    } catch (err) {
      console.error("Manual copy fallback failure:", err);
      alert("复制失败，您的浏览器可能有限制。请手动选择文字进行复制。");
    }
  };

  // Call server proxy backend to execute real AI analysis
  const handleRunAnalysis = async () => {
    if (!activeItem) return;

    setIsAnalyzing(true);
    setApiError(null);

    // Update state to show that this item is analyzing
    setMediaList(prev => prev.map(item => {
      if (item.id === activeItem.id) {
        return { ...item, isAnalyzing: true, error: undefined };
      }
      return item;
    }));

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: activeItem.type,
          payload: activeItem.payload,
          prompt: customPromptText.trim()
        })
      });

      const data: AnalyzeResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || "Upstream AI execution failed.");
      }

      // Update the item state with analysis results
      setMediaList(prev => prev.map(item => {
        if (item.id === activeItem.id) {
          // If it was a web link, and we fetched a beautiful real webpage title, rename the item to that title!
          const updatedName = (item.type === "web_link" && data.meta?.title) ? data.meta.title : item.name;
          return {
            ...item,
            name: updatedName,
            analysisResult: data.result,
            isAnalyzing: false
          };
        }
        return item;
      }));

    } catch (err: any) {
      console.error("Fetch analysis error:", err);
      const errorMessage = err.message || "无法连接到服务器进行识别分析，请检查后端状态。";
      setApiError(errorMessage);
      
      setMediaList(prev => prev.map(item => {
        if (item.id === activeItem.id) {
          return {
            ...item,
            isAnalyzing: false,
            error: errorMessage
          };
        }
        return item;
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen font-sans transition-colors duration-200">
      {/* Upper Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 rounded flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              AgnesInsight <span className="text-indigo-600 dark:text-indigo-400">Pro</span>
              <span className="hidden sm:inline text-xs font-normal text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-2">
                智能媒体识别与网页分析
              </span>
            </h1>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
              支持上传本地图片与分析网页链接，采用 custom AI 进行高精度深度提取
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-none">Active Model</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">agnes-2.0-flash</span>
          </div>

          <div className="hidden lg:block h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-full border border-slate-200 dark:border-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">apihub.agnes-ai.com/v1</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 sm:hidden"></div>

          <div className="flex items-center gap-1">
            {/* Reset Media button */}
            <button 
              id="reset-library-btn"
              onClick={handleResetDefaults}
              title="重置媒体素材库为默认示例"
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Theme toggler */}
            <button
              id="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Interface Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Side Section: Upload Panel & Media Library (5 Cols on Desktop) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Add & Upload Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <Plus className="h-4 w-4" /> 新增媒体材料
              </h2>
              {/* Tab Toggler */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                <button
                  id="tab-btn-image"
                  onClick={() => setActiveTab("image")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "image" 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  本地图片
                </button>
                <button
                  id="tab-btn-link"
                  onClick={() => setActiveTab("web_link")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activeTab === "web_link" 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  网页链接
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Upload Local Image */}
            {activeTab === "image" && (
              <div className="space-y-3">
                <div
                  id="image-dropzone"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                    dragActive 
                      ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/10" 
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {addLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mb-2" />
                  )}
                  
                  <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {addLoading ? "正在处理并加载图片..." : "点击选择 或 拖拽图片至此"}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    支持 JPEG, PNG, WEBP, SVG 等常见图片格式 (大小不超过 20MB)
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Add Web Link */}
            {activeTab === "web_link" && (
              <form onSubmit={handleAddLink} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    网页 URL 地址
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. ai.google.dev/aistudio"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    自定义材料名称 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="不填则自动使用网页标题"
                    value={inputLinkName}
                    onChange={(e) => setInputLinkName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>

                <button
                  id="add-link-submit-btn"
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-xs md:text-sm py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-slate-900/5 cursor-pointer"
                >
                  <Link2 className="h-4 w-4" /> 导入素材链接
                </button>
              </form>
            )}
          </div>

          {/* Media Materials List Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm flex flex-col flex-1 min-h-[350px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4" /> 媒体素材库 ({mediaList.length})
              </h2>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full">
                本地存储
              </span>
            </div>

            {/* List scrolling area */}
            <div className="space-y-2 overflow-y-auto max-h-[480px] pr-1 flex-1 custom-scrollbar">
              {mediaList.map((item) => {
                const isSelected = item.id === selectedId;
                const hasAnalysis = !!item.analysisResult;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setApiError(null);
                    }}
                    className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected 
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/60 dark:border-indigo-500/40 shadow-sm" 
                        : "bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-200 dark:hover:border-slate-800"
                    }`}
                  >
                    {/* Media Type visual preview indicator */}
                    <div className="relative flex-shrink-0">
                      {item.type === "image" ? (
                        item.thumbnail ? (
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-500 flex items-center justify-center border border-cyan-100 dark:border-cyan-900/20">
                          <Globe className="h-5 w-5" />
                        </div>
                      )}
                      
                      {/* Analysis Badge Status Dot */}
                      <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        item.isAnalyzing 
                          ? "bg-amber-500 animate-ping" 
                          : hasAnalysis 
                            ? "bg-emerald-500" 
                            : "bg-slate-300 dark:bg-slate-700"
                      }`} title={item.isAnalyzing ? "正在识别分析中..." : hasAnalysis ? "已完成识别分析" : "未分析"} />
                    </div>

                    {/* Metadata text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.addedAt.toLocaleDateString() === new Date().toLocaleDateString()
                            ? `今天 ${item.addedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : item.addedAt.toLocaleDateString()
                          }
                        </span>
                        
                        {/* Type badge text */}
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                          item.type === "image" 
                            ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                            : "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400"
                        }`}>
                          {item.type === "image" ? "图片" : "网页"}
                        </span>
                      </div>
                    </div>

                    {/* Trash Delete button on hover */}
                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer"
                      title="从素材库中删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Quick tips footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-start gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl">
              <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                所有添加的媒体均储存在您本地浏览器中。切换或选择不同素材可在右侧进入高级配置、自定义 Prompt 并启动 AI 解析。
              </p>
            </div>
          </div>
        </section>

        {/* Right Side Section: Workspace & Detailed Report Panel (7 Cols on Desktop) */}
        <section className="lg:col-span-7 flex flex-col">
          
          {activeItem ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 shadow-sm flex flex-col gap-5 flex-1 transition-all">
              
              {/* Media Preview Card */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 transition-all">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    {activeItem.type === "image" ? <ImageIcon className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                    当前选中媒体预览
                  </span>
                  {activeItem.type === "web_link" && (
                    <a
                      href={activeItem.payload}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      访问原网站 <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                  {/* Thumbnail / Visual visualizer */}
                  {activeItem.type === "image" ? (
                    <div className="w-full md:w-40 max-h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner">
                      <img 
                        src={activeItem.payload} 
                        alt={activeItem.name} 
                        className="w-full h-full object-contain max-h-36"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-40 h-24 rounded-xl border border-cyan-200/40 dark:border-cyan-800/20 bg-cyan-50/20 dark:bg-cyan-950/20 flex flex-col items-center justify-center p-3 text-center shadow-inner">
                      <Globe className="h-8 w-8 text-cyan-500 mb-1" />
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold truncate w-full">
                        WEB CONTENT
                      </span>
                    </div>
                  )}

                  {/* Metadata and details */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {activeItem.name}
                    </h3>
                    
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 truncate select-all" title={activeItem.payload}>
                      {activeItem.type === "image" ? "Data URI: Base64 Multi-Modal" : activeItem.payload}
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3.5">
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        素材格式: {activeItem.type === "image" ? "PNG/JPEG Multimodal" : "HTML Text Scraping"}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        activeItem.analysisResult 
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                        分析状态: {activeItem.analysisResult ? "已分析报告" : "等待分析"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Configuration & Custom prompt presets */}
              <div className="space-y-3.5 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/20 dark:border-slate-800/20 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    选择识别分析指令
                  </span>
                  
                  {/* Preset Quick Select tabs */}
                  <div className="flex flex-wrap gap-1">
                    {PROMPT_PRESETS[activeItem.type].map((preset, idx) => (
                      <button
                        key={idx}
                        id={`preset-btn-${idx}`}
                        onClick={() => setSelectedPresetIndex(idx)}
                        className={`px-2 py-0.8 text-[10px] font-bold rounded-md border transition-all ${
                          selectedPresetIndex === idx
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit prompt textarea */}
                <div>
                  <textarea
                    rows={2.5}
                    placeholder="输入自定义分析指令，告诉 AI 您想识别或提取什么..."
                    value={customPromptText}
                    onChange={(e) => setCustomPromptText(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner resize-none"
                  />
                </div>

                {/* Main Action Start Analysis Trigger */}
                <button
                  id="start-analysis-btn"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || activeItem.isAnalyzing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold text-xs md:text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isAnalyzing || activeItem.isAnalyzing ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      正在努力深度析取与识别分析中 (约需10-15秒)...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      开始 AI 智能识别分析报告
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Result Output Container */}
              <div className="flex-1 flex flex-col border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/10">
                
                {/* Result header bar */}
                <div className="bg-slate-100/60 dark:bg-slate-900/60 px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    智能识别分析结果报告
                  </span>

                  {activeItem.analysisResult && (
                    <button
                      id="copy-result-btn"
                      onClick={() => handleCopyResults(activeItem.analysisResult || "")}
                      className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      {copiedId ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          已复制结果
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-indigo-500" />
                          复制分析结果
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Result main scroll window */}
                <div className="p-5 md:p-6 overflow-y-auto max-h-[500px] flex-1 bg-white dark:bg-slate-950/40 custom-scrollbar">
                  
                  {isAnalyzing || activeItem.isAnalyzing ? (
                    /* Elegant loading screen */
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-4">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500 shadow-inner animate-pulse">
                          <Sparkles className="h-7 w-7 animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          智能神经网络计算中...
                        </h4>
                        <p className="text-xs text-slate-400 max-w-[280px]">
                          正在深入读取您提供的媒体物料，提取精细化多模态表征，稍后即将生成结构化分析报告。
                        </p>
                      </div>
                      
                      {/* Loading Skeletons */}
                      <div className="w-full max-w-sm space-y-2 pt-4">
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-full animate-pulse" />
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-5/6 animate-pulse" />
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-4/5 animate-pulse" />
                      </div>
                    </div>
                  ) : apiError || activeItem.error ? (
                    /* Error state */
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-rose-800 dark:text-rose-400">
                          AI 识别解析请求发生错误
                        </h4>
                        <p className="text-xs text-rose-700/90 dark:text-rose-400/80 mt-1 font-mono break-all leading-normal">
                          {apiError || activeItem.error}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={handleRunAnalysis}
                            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 text-[11px] font-bold rounded-lg hover:bg-rose-200 dark:hover:bg-rose-800/40 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" /> 重试分析
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : activeItem.analysisResult ? (
                    /* Rendered markdown view */
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <MarkdownView content={activeItem.analysisResult} />
                    </div>
                  ) : (
                    /* Empty analysis report state */
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                      <Sparkles className="h-10 w-10 text-indigo-400/60 dark:text-indigo-500/40 mb-3" />
                      <p className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
                        该媒体素材尚未进行识别分析
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                        请在上方确认您的分析 Prompt，然后点击“开始 AI 智能识别分析报告”按钮启动处理。
                      </p>
                    </div>
                  )}

                </div>

                {/* Footer details bar */}
                {activeItem.analysisResult && (
                  <div className="bg-slate-50 dark:bg-slate-900/30 px-4 py-2 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono font-medium gap-1.5">
                    <span>推理模型: {process.env.MODEL || "agnes-2.0-flash"}</span>
                    <span>字数: {activeItem.analysisResult.length} 字</span>
                    <span>安全环境: Server SSL Proxy</span>
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* Selected empty state (should rarely happen because of defaults) */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-12 text-center flex flex-col items-center justify-center flex-1 h-full shadow-sm">
              <FileCode className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                素材尚未选中
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                请在左侧点击或上传新的图片、添加新的网页链接来激活具体分析面板。
              </p>
            </div>
          )}

        </section>

      </main>

      {/* Page Footer / Status Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-3 md:py-0 md:h-11 flex flex-col md:flex-row items-center justify-between px-6 md:px-8 shrink-0 text-[10px] font-mono tracking-tight gap-2 mt-12">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <span className="flex items-center gap-1.5 uppercase font-semibold">
            STATUS: <span className="text-emerald-400 font-bold flex items-center gap-1">● LIVE</span>
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span>
            BASE_URL: <span className="text-slate-200">apihub.agnes-ai.com/v1</span>
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span>
            LATENCY: <span className="text-slate-300 font-semibold">~240ms</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 text-slate-500">
          <span>
            API_KEY: <span className="text-slate-300">sk-ks4du...ZT3</span>
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span>
            MODEL: <span className="text-indigo-400 font-bold">agnes-2.0-flash</span>
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="text-slate-400 font-sans font-medium">
            © 2026 AgnesInsight Pro
          </span>
        </div>
      </footer>
    </div>
  );
}

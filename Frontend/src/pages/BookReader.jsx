import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { X, BookOpen, ChevronUp, Sun, Moon, Coffee, ZoomIn, ZoomOut} from "lucide-react";
import "../css/BookReader.css";

const SAMPLE_PAGES = 5;
const THEMES = ["light", "sepia", "dark"];
const THEME_ICONS = { light: Sun, sepia: Coffee, dark: Moon };
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 15;
const FONT_SIZES = ["sm", "md", "lg"];

export default function BookReader({ user }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSample = searchParams.get("sample") === "true";

  const [book, setBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sampleBlocked, setSampleBlocked] = useState(false);

  // New feature states 
  const [theme, setTheme] = useState(() => localStorage.getItem("reader-theme") || "light");
  const [zoom, setZoom] = useState(() => Number(localStorage.getItem("reader-zoom")) || 100);
  const [jumpMode, setJumpMode] = useState(false);
  const [jumpValue, setJumpValue] = useState("");

  const scrollRef = useRef(null);
  const pageRefs = useRef([]);
  const jumpInputRef = useRef(null);

  // Persist preferences
  useEffect(() => { localStorage.setItem("reader-theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("reader-zoom", zoom); }, [zoom]);

  // Focus jump input when activated
  useEffect(() => {
    if (jumpMode) jumpInputRef.current?.focus();
  }, [jumpMode]);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setBook(data.book);

          if (!isSample) {
            const accessRes = await fetch(`${import.meta.env.VITE_API_URL}/api/gifting/check-access/${data.book._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const accessData = await accessRes.json();
            if (!accessData.hasAccess) {
              navigate(`/book/${data.book._id}`);
              return;
            }
          }

          loadPdfPages(data.book.bookFile.url);

          if (!isSample) {
            fetch(`${import.meta.env.VITE_API_URL}/api/books/reading-history`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookId: data.book._id })
            }).catch(() => {});
          }
        } else {
          navigate("/home");
        }
      } catch (err) {
        console.error(err);
        navigate("/home");
      }
    };
    fetchBook();
  }, [id]);

  const loadPdfPages = async (url) => {
    try {
      let attempts = 0;
      while (!window['pdfjs-dist/build/pdf'] && attempts < 20) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }

      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) { setLoading(false); return; }

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const pdf = await pdfjsLib.getDocument(url).promise;
      const totalPages = isSample ? Math.min(SAMPLE_PAGES, pdf.numPages) : pdf.numPages;
      const canvases = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvases.push(canvas.toDataURL());
        setLoadingProgress(Math.round((i / totalPages) * 100));
      }

      setPages(canvases);
    } catch (err) {
      console.error("PDF load error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Track current page
  useEffect(() => {
    if (pages.length === 0) return;
    const observers = [];
    pageRefs.current.forEach((ref, idx) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCurrentPage(idx + 1);
            if (isSample && idx + 1 >= SAMPLE_PAGES) setSampleBlocked(true);
          }
        },
        { threshold: 0.5, root: scrollRef.current }
      );
      observer.observe(ref);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [pages]);

  // Scroll-to-top visibility
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Handlers ──────────────────────────────────────────────

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  const cycleTheme = () => {
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  };

  const handleZoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  const handleZoomOut = () => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP));

  const handlePageCountClick = () => {
    if (pages.length === 0) return;
    setJumpValue(String(currentPage));
    setJumpMode(true);
  };

  const commitJump = () => {
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= pages.length) {
      pageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setJumpMode(false);
    setJumpValue("");
  };

  const handleJumpKeyDown = (e) => {
    if (e.key === "Enter") commitJump();
    if (e.key === "Escape") { setJumpMode(false); setJumpValue(""); }
  };

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <div className="reader-layout" data-theme={theme}>

      {/* Top Bar */}
      <div className="reader-topbar">
        <button className="reader-close" onClick={() => navigate(`/book/${id}`)}>
          <X size={18} />
        </button>

        <div className="reader-book-info">
          <BookOpen size={15} />
          <span className="reader-title">{book?.title || "Loading..."}</span>
          {isSample && <span className="reader-sample-badge">Sample</span>}
        </div>

        {/* Controls group */}
        <div className="reader-controls">

          {/* Zoom */}
          <div className="reader-zoom-group">
            <button className="reader-ctrl-btn" onClick={handleZoomOut} disabled={zoom <= ZOOM_MIN} title="Zoom out">
              <ZoomOut size={15} />
            </button>
            <span className="reader-zoom-value">{zoom}%</span>
            <button className="reader-ctrl-btn" onClick={handleZoomIn} disabled={zoom >= ZOOM_MAX} title="Zoom in">
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Theme */}
          <button className="reader-ctrl-btn reader-theme-btn" onClick={cycleTheme} title={`Theme: ${theme}`}>
            <ThemeIcon size={15} />
          </button>

          {/* Page counter / jump */}
          {jumpMode ? (
            <div className="reader-jump-wrap">
              <input
                ref={jumpInputRef}
                className="reader-jump-input"
                type="number"
                min={1}
                max={pages.length}
                value={jumpValue}
                onChange={e => setJumpValue(e.target.value)}
                onKeyDown={handleJumpKeyDown}
                onBlur={commitJump}
              />
              <span className="reader-jump-sep">/ {pages.length}</span>
            </div>
          ) : (
            <button
              className="reader-page-count reader-page-count--btn"
              onClick={handlePageCountClick}
              title="Jump to page"
              disabled={pages.length === 0}
            >
              {pages.length > 0 ? `${currentPage} / ${pages.length}` : ""}
            </button>
          )}

        </div>
      </div>

      {/* Progress bar */}
      {pages.length > 0 && (
        <div className="reader-progress-bar">
          <div
            className="reader-progress-fill"
            style={{ width: `${(currentPage / pages.length) * 100}%` }}
          />
        </div>
      )}

      {/* Scrollable Stage */}
      <div className="reader-stage" ref={scrollRef}>
        {loading ? (
          <div className="reader-loading">
            <div className="reader-spinner" />
            <p>Loading pages... {loadingProgress > 0 ? `${loadingProgress}%` : ""}</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="reader-error">
            <p>Could not load book pages.</p>
          </div>
        ) : (
          <div className="reader-pages">
            {pages.map((src, idx) => (
              <div
                key={idx}
                className="reader-page"
                ref={el => pageRefs.current[idx] = el}
                style={{ maxWidth: `${(720 * zoom) / 100}px` }}
              >
                <img src={src} alt={`Page ${idx + 1}`} draggable={false} />
                <span className="reader-page-num">{idx + 1}</span>
              </div>
            ))}

            {isSample && (
              <div className="sample-wall">
                <div className="sample-wall-content">
                  <BookOpen size={44} />
                  <h3>End of Sample</h3>
                  <p>You've read the first {SAMPLE_PAGES} pages.<br />Purchase to continue reading.</p>
                  <button onClick={() => navigate(`/book/${id}`)}>View Book</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={scrollToTop}>
          <ChevronUp size={18} />
        </button>
      )}

    </div>
  );
}
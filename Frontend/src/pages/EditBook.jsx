import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImagePlus, FileText, Tag, DollarSign, BookOpen, User, AlignLeft, Layers, X, ArrowLeft, Save } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import Navbar from "../components/Navbar";
import PublisherSidebar from "../components/PublisherSidebar";
import "../css/EditBook.css";

const GENRES = [
  "Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction",
  "Fantasy", "Biography", "Self-Help", "History", "Horror",
  "Thriller", "Children", "Academic", "Poetry", "Other"
];

export default function EditBook({ user, handleLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const coverRef = useRef(null);
  const bookFileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "", author: "", description: "",
    genre: "", price: "", isFree: false,
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [existingBookFile, setExistingBookFile] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${id}/edit`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const b = data.book;
          setForm({
            title: b.title,
            author: b.author,
            description: b.description,
            genre: b.genre,
            price: b.price?.toString() || "0",
            isFree: b.isFree,
          });
          setTags(b.tags || []);
          setExistingCoverUrl(b.coverImage?.url);
          setExistingBookFile(b.bookFile?.url);
        } else {
          notifyError("Book not found.");
          navigate("/publisher-dashboard/books");
        }
      } catch (err) {
        notifyError("Failed to load book.");
        navigate("/publisher-dashboard/books");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag) && tags.length < 8) {
        setTags([...tags, tag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleSave = async () => {
    if (!form.title || !form.author || !form.description || !form.genre) {
      notifyError("Please fill in all required fields.");
      return;
    }
    if (!form.isFree && (!form.price || parseFloat(form.price) <= 0)) {
      notifyError("Please enter a valid price or mark as free.");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("author", form.author);
    formData.append("description", form.description);
    formData.append("genre", form.genre);
    formData.append("tags", tags.join(","));
    formData.append("price", form.isFree ? "0" : form.price);
    formData.append("isFree", form.isFree);
    if (coverFile) formData.append("cover", coverFile);
    if (bookFile) formData.append("bookFile", bookFile);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess(data.message);
        setTimeout(() => navigate("/publisher-dashboard/books"), 800);
      } else {
        notifyError(data.message || "Update failed.");
      }
    } catch (err) {
      notifyError("Server error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="editbook-layout">
      <div className="editbook-loading">
        <div className="editbook-spinner" />
        <p>Loading book...</p>
      </div>
    </div>
  );

  return (
    <div className="editbook-layout">
      <Navbar handleLogout={handleLogout} user={user} />
      <PublisherSidebar user={user} />

      <main className="editbook-main">

        {/* Header */}
        <div className="editbook-header">
          <button className="back-btn" onClick={() => navigate("/publisher-dashboard/books")}>
            <ArrowLeft size={15} /> My Books
          </button>
          <h1 className="editbook-title">Edit Book</h1>
          <p className="editbook-subtitle">Update your book details below.</p>
        </div>

        <div className="upload-layout">

          {/* LEFT — Cover + File */}
          <div className="upload-left">

            {/* Cover Image */}
            <div className="upload-card">
              <h3 className="upload-card-title"><ImagePlus size={16} /> Cover Image</h3>
              <div
                className={`cover-dropzone has-cover`}
                onClick={() => coverRef.current.click()}
              >
                <img
                  src={coverPreview || existingCoverUrl}
                  alt="Cover"
                  className="cover-preview"
                />
                {coverFile && <div className="cover-new-badge">New</div>}
              </div>
              <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} hidden />
              {coverFile && (
                <button className="remove-cover" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                  <X size={14} /> Remove new cover
                </button>
              )}
              <p className="cover-hint">Click to replace cover</p>
            </div>

            {/* Book File */}
            <div className="upload-card">
              <h3 className="upload-card-title"><FileText size={16} /> Book File</h3>
              <div
                className={`file-dropzone ${bookFile ? "has-file" : "has-file"}`}
                onClick={() => bookFileRef.current.click()}
              >
                {bookFile ? (
                  <div className="file-info">
                    <FileText size={24} />
                    <span className="file-name">{bookFile.name}</span>
                    <span className="file-size">{(bookFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="file-info">
                    <FileText size={24} />
                    <span className="file-name">Current file uploaded</span>
                    <span className="file-size">Click to replace</span>
                  </div>
                )}
              </div>
              <input ref={bookFileRef} type="file" accept=".pdf,.epub" onChange={(e) => setBookFile(e.target.files[0])} hidden />
              {bookFile && (
                <button className="remove-cover" onClick={() => setBookFile(null)}>
                  <X size={14} /> Keep original file
                </button>
              )}
            </div>
          </div>

          {/* RIGHT — Form */}
          <div className="upload-right">
            <div className="upload-card">
              <h3 className="upload-card-title"><BookOpen size={16} /> Book Details</h3>

              <div className="form-grid">

                <div className="input-group full">
                  <label><BookOpen size={13} /> Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} placeholder="Enter book title" />
                </div>

                <div className="input-group full">
                  <label><User size={13} /> Author *</label>
                  <input name="author" value={form.author} onChange={handleChange} placeholder="Author name" />
                </div>

                <div className="input-group full">
                  <label><AlignLeft size={13} /> Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={5} />
                </div>

                <div className="input-group half">
                  <label><Layers size={13} /> Genre *</label>
                  <select name="genre" value={form.genre} onChange={handleChange}>
                    <option value="">Select genre</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="input-group half">
                  <label>Rs. Price *</label>
                  <div className="price-row">
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.isFree ? "" : form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      disabled={form.isFree}
                    />
                    <label className="free-toggle">
                      <input type="checkbox" name="isFree" checked={form.isFree} onChange={handleChange} />
                      Free
                    </label>
                  </div>
                </div>

                <div className="input-group full">
                  <label><Tag size={13} /> Tags <span className="optional">(press Enter or comma)</span></label>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="e.g. adventure, magic"
                  />
                  {tags.length > 0 && (
                    <div className="tags-list">
                      {tags.map(tag => (
                        <span key={tag} className="tag-pill">
                          {tag}
                          <button onClick={() => removeTag(tag)}><X size={11} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="upload-actions">
              <button className="btn-draft" onClick={() => navigate("/publisher-dashboard/books")} disabled={saving}>
                Cancel
              </button>
              <button className="btn-publish" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : <><Save size={15} /> Save Changes</>}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
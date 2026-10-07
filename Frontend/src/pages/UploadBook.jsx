import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, FileText, Tag, DollarSign, BookOpen, User, AlignLeft, Layers, X, ArrowLeft } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import "../css/UploadBook.css";

const GENRES = [
  "Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction",
  "Fantasy", "Biography", "Self-Help", "History", "Horror",
  "Thriller", "Children", "Academic", "Poetry", "Other"
];

export default function UploadBook({ user }) {
  const navigate = useNavigate();
  const coverRef = useRef(null);
  const bookFileRef = useRef(null);

  const [form, setForm] = useState({
    title: "", author: "", description: "",
    genre: "", tags: "", price: "", isFree: false,
  });

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

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

  const handleBookFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBookFile(file);
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

  const handleSubmit = async (status) => {
    if (!form.title || !form.author || !form.description || !form.genre) {
      notifyError("Please fill in all required fields.");
      return;
    }
    if (!coverFile) {
      notifyError("Please upload a cover image.");
      return;
    }
    if (!bookFile) {
      notifyError("Please upload a book file.");
      return;
    }
    if (!form.isFree && (!form.price || parseFloat(form.price) <= 0)) {
      notifyError("Please enter a valid price, or mark the book as free.");
      return;
    }

    setLoading(status);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("author", form.author);
    formData.append("description", form.description);
    formData.append("genre", form.genre);
    formData.append("tags", tags.join(","));
    formData.append("price", form.isFree ? "0" : form.price);
    formData.append("isFree", form.isFree);
    formData.append("status", status);
    formData.append("cover", coverFile);
    formData.append("bookFile", bookFile);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        notifySuccess(data.message);
        setTimeout(() => navigate("/publisher-dashboard"), 800);
      } else {
        notifyError(data.message || "Upload failed.");
      }
    } catch (err) {
      notifyError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-header">
        <button className="upload-back-btn" onClick={() => navigate("/publisher-dashboard")}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h1 className="upload-title">Upload a Book</h1>
        <p className="upload-subtitle">Fill in the details below to publish or save your book as a draft.</p>
      </div>

      <div className="upload-layout">

        {/* LEFT — Cover + File */}
        <div className="upload-left">

          {/* Cover Image */}
          <div className="upload-card">
            <h3 className="upload-card-title"><ImagePlus size={16} /> Cover Image</h3>
            <div
              className={`cover-dropzone ${coverPreview ? "has-cover" : ""}`}
              onClick={() => coverRef.current.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" className="cover-preview" />
              ) : (
                <div className="cover-placeholder">
                  <ImagePlus size={32} />
                  <p>Click to upload cover</p>
                  <span>JPG, PNG, WEBP</span>
                </div>
              )}
            </div>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              hidden
            />
            {coverPreview && (
              <button className="remove-cover" onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                <X size={14} /> Remove
              </button>
            )}
          </div>

          {/* Book File */}
          <div className="upload-card">
            <h3 className="upload-card-title"><FileText size={16} /> Book File</h3>
            <div
              className={`file-dropzone ${bookFile ? "has-file" : ""}`}
              onClick={() => bookFileRef.current.click()}
            >
              {bookFile ? (
                <div className="file-info">
                  <FileText size={24} />
                  <span className="file-name">{bookFile.name}</span>
                  <span className="file-size">{(bookFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="file-placeholder">
                  <FileText size={32} />
                  <p>Click to upload book file</p>
                  <span>PDF or ePub</span>
                </div>
              )}
            </div>
            <input
              ref={bookFileRef}
              type="file"
              accept=".pdf,.epub"
              onChange={handleBookFileChange}
              hidden
            />
            {bookFile && (
              <button className="remove-cover" onClick={() => setBookFile(null)}>
                <X size={14} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — Form Fields */}
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

              <div className="input-group half">
                <label><Layers size={13} /> Genre *</label>
                <select name="genre" value={form.genre} onChange={handleChange}>
                  <option value="">Select genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="input-group half">
                <label>RS. Price *</label>
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
                <label><Tag size={13} /> Tags <span className="optional">(press Enter or comma to add)</span></label>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="e.g. adventure, magic, thriller"
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

          {/* Action Buttons */}
          <div className="upload-actions">
            <button
              className="btn-draft"
              onClick={() => handleSubmit("draft")}
              disabled={!!loading}
            >
              {loading === "draft" ? "Saving..." : "Save as Draft"}
            </button>
            <button
              className="btn-publish"
              onClick={() => handleSubmit("published")}
              disabled={!!loading}
            >
              {loading === "published" ? "Publishing..." : "Publish Book"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
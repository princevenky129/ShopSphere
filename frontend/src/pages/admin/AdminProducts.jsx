import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    description: "",
    images: [], // NEW: holds the Cloudinary URL(s) for this product
  });

  // NEW: tracks the image upload process separately from form submission,
  // so we can show "Uploading..." and disable the submit button while
  // the image is still being sent to Cloudinary.
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/products", {
        params: { page, limit: LIMIT },
      });
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NEW: runs the moment the admin picks a file in the file input.
  // Uploads immediately (not on form submit) so they can see the
  // preview and confirm it looks right before saving the product.
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadError("");

    try {
      // FormData is the browser's built-in way to build a multipart
      // form body — the same format curl's -F flag builds, and the
      // same format multer expects on the backend.
      const uploadData = new FormData();
      uploadData.append("image", file);

      const res = await axiosInstance.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Store the returned Cloudinary URL as a single-item array,
      // matching how Product.js stores images: [{ type: String }]
      setFormData((prev) => ({ ...prev, images: [res.data.url] }));
    } catch (err) {
      setUploadError("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", category: "", stock: "", description: "", images: [] });
    setEditingId(null);
    setShowForm(false);
    setUploadError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put("/products/" + editingId, formData);
      } else {
        await axiosInstance.post("/products", formData);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError("Failed to save product.");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
      images: product.images || [], // NEW: carry over existing image(s) when editing
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this product?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete("/products/" + id);
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      setError("Failed to delete product.");
    }
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Product name" required className="border p-2 rounded" />
          <input name="price" value={formData.price} onChange={handleChange} placeholder="Price" type="number" required className="border p-2 rounded" />
          <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" required className="border p-2 rounded" />
          <input name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock quantity" type="number" required className="border p-2 rounded" />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="border p-2 rounded col-span-2" />

          {/* NEW: image upload field */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="border p-2 rounded w-full"
            />

            {uploadingImage && (
              <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
            )}
            {uploadError && (
              <p className="text-sm text-red-600 mt-2">{uploadError}</p>
            )}
            {/* Show a preview once we have an uploaded (or existing, when editing) image */}
            {formData.images.length > 0 && (
              <img
                src={formData.images[0]}
                alt="Preview"
                className="w-24 h-24 object-cover rounded mt-2 border"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={uploadingImage}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 col-span-2 disabled:opacity-50"
          >
            {editingId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b">
                  {/* NEW: thumbnail column */}
                  <td className="p-3">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.category}</td>
                  <td className="p-3">₹{product.price}</td>
                  <td className="p-3">{product.stock}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => handleEdit(product)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Edit</button>
                    <button onClick={() => handleDelete(product._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="text-sm px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="text-sm px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminProducts;
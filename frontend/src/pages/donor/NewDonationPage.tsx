import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ImagePlus, X } from "lucide-react";
import { DonorAPI } from "../../services/endpoints";
import { FOOD_CATEGORIES } from "../../types";
import { MapPicker } from "../../components/MapPicker";
import { InlineSpinner } from "../../components/LoadingScreen";
import { useToast } from "../../context/ToastContext";
import { apiErrorMessage } from "../../services/api";

interface ItemRow {
  name: string;
  quantity: string;
  unit: string;
}

export function NewDonationPage() {
  const navigate = useNavigate();
  const { show } = useToast();

  const [foodName, setFoodName] = useState("");
  const [category, setCategory] = useState<string>(FOOD_CATEGORIES[0]);
  const [isVeg, setIsVeg] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("servings");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [expiry, setExpiry] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => setItems((prev) => [...prev, { name: "", quantity: "", unit: "kg" }]);
  const updateItem = (idx: number, field: keyof ItemRow, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    setImages((prev) => [...prev, ...Array.from(files)].slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lat == null || lng == null) {
      show("Please select a pickup location on the map", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("food_name", foodName);
      formData.append("category", category);
      formData.append("is_veg", String(isVeg));
      formData.append("quantity", quantity);
      formData.append("quantity_unit", unit);
      formData.append("description", description);
      if (cookingTime) formData.append("cooking_time", cookingTime);
      formData.append("expiry_datetime", expiry);
      formData.append("pickup_address", address);
      formData.append("latitude", String(lat));
      formData.append("longitude", String(lng));
      formData.append("contact_phone", phone);

      items.forEach((item, idx) => {
        formData.append(`items[${idx}][name]`, item.name);
        formData.append(`items[${idx}][quantity]`, item.quantity || "0");
        formData.append(`items[${idx}][unit]`, item.unit);
      });

      images.forEach((file) => formData.append("images", file));

      await DonorAPI.create(formData);
      show("Donation listed! Nearby NGOs have been notified.", "success");
      navigate("/donor");
    } catch (err) {
      show(apiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Donor</p>
        <h1 className="text-2xl font-display font-semibold text-ink dark:text-brand-50">List a new donation</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label" htmlFor="food-name">Food name</label>
          <input id="food-name" required className="input" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Wedding function leftovers" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2 h-[42px]">
              <button type="button" onClick={() => setIsVeg(true)} className={`flex-1 rounded-xl text-sm font-semibold ${isVeg ? "bg-brand-600 text-white" : "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300"}`}>Veg</button>
              <button type="button" onClick={() => setIsVeg(false)} className={`flex-1 rounded-xl text-sm font-semibold ${!isVeg ? "bg-red-500 text-white" : "bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300"}`}>Non-Veg</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="quantity">Quantity</label>
            <input id="quantity" type="number" min="0" step="0.1" required className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="unit">Unit</label>
            <input id="unit" required className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="servings, kg, pieces…" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">Description (optional)</label>
          <textarea id="description" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {/* Itemized breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label mb-0">Itemized breakdown (optional)</span>
            <button type="button" onClick={addItem} className="btn-ghost text-xs px-2 py-1">
              <Plus className="h-3.5 w-3.5" /> Add item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input className="input" placeholder="Item name" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                <input className="input w-24" placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                <input className="input w-20" placeholder="Unit" value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} />
                <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 px-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <span className="label">Photos (optional, up to 5)</span>
          <div className="flex flex-wrap gap-2">
            {images.map((file, idx) => (
              <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden border border-brand-200 dark:border-brand-800">
                <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="h-20 w-20 rounded-lg border-2 border-dashed border-brand-300 dark:border-brand-700 flex items-center justify-center text-brand-400 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/40">
                <ImagePlus className="h-5 w-5" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="cooking-time">Cooking time (optional)</label>
            <input id="cooking-time" type="datetime-local" className="input" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="expiry">Expiry / best-before</label>
            <input id="expiry" type="datetime-local" required className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="phone">Contact phone</label>
          <input id="phone" required className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="address">Pickup address</label>
          <input id="address" required className="input mb-2" value={address} onChange={(e) => setAddress(e.target.value)} />
          <MapPicker latitude={lat} longitude={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting && <InlineSpinner />}
          {submitting ? "Publishing…" : "Publish donation"}
        </button>
      </form>
    </div>
  );
}

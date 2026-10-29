// UPDATED: shared Create/Edit product form (Stitch create + edit product designs).
// Sends the same multipart fields as before: name, price, description, catagory, stock, seller, images[].
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAlert } from "../ui/Alerts";
import { PRODUCT_CATEGORIES } from "../../constants/productCategories";
import { formatPrice } from "../../i18n";
import "../cart/Checkout.css"; // .vx-control, .vx-field-* form primitives
import "./ProductAdmin.css";

const MAX_IMAGE = 5 * 1024 * 1024;
const IMAGE_TYPE = /^image\/(png|jpeg|gif|webp)$/;

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ProductForm({ mode, initial = {}, existingImages = [], loading, onSubmit }) {
  const { t } = useTranslation();
  const alert = useAlert();
  const editing = mode === "edit";

  const [form, setForm] = useState({
    name: initial.name || "",
    seller: initial.seller || "",
    description: initial.description || "",
    catagory: initial.catagory || PRODUCT_CATEGORIES[0],
    price: initial.price ?? "",
    stock: initial.stock ?? "",
  });
  // UPDATED: one ordered list of existing + pending images; the first one is the main image.
  // Removals are staged here and only sent on Save, so Discard never destroys an existing image.
  const [items, setItems] = useState(() =>
    existingImages.map((image) => ({ key: `e:${image.public_id}`, id: image.public_id, url: image.url, isNew: false })),
  );
  const [seq, setSeq] = useState(0);
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    if (files.some((file) => !IMAGE_TYPE.test(file.type) || file.size > MAX_IMAGE)) {
      alert.error(t("adminProducts.form.validation.imageInvalid"));
      return;
    }
    const urls = await Promise.all(files.map(readFile));
    // new images go to the END: adding a photo never takes over the main slot
    setItems((current) => [...current, ...urls.map((url, i) => ({ key: `n:${seq + i}`, url, isNew: true }))]);
    setSeq((n) => n + urls.length);
    setErrors((current) => ({ ...current, images: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const next = {
      name: !form.name.trim() ? "nameRequired" : form.name.length > 100 ? "nameTooLong" : undefined,
      seller: form.seller.trim() ? undefined : "sellerRequired",
      description: form.description.trim() ? undefined : "descriptionRequired",
      price: form.price === "" || !Number.isFinite(price) || price < 0 ? "priceInvalid" : undefined,
      stock: form.stock === "" || !Number.isSafeInteger(stock) || stock < 0 ? "stockInvalid" : undefined,
      images: items.length === 0 ? "imagesRequired" : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("price", price);
    formData.set("description", form.description);
    formData.set("catagory", form.catagory);
    formData.set("stock", stock);
    formData.set("seller", form.seller);
    const fresh = items.filter((item) => item.isNew);
    fresh.forEach((item) => formData.append("images", item.url));
    // Edit: tokens in display order ("e:<public_id>" kept, "n:<index>" new); the server validates them.
    if (editing) formData.set("order", JSON.stringify(items.map((item) => (item.isNew ? `n:${fresh.indexOf(item)}` : `e:${item.id}`))));
    onSubmit(formData);
  };

  const field = (id, name, label, control, hint) => (
    <div className="vx-field">
      <label htmlFor={id} className="vx-field-label">{label}</label>
      {React.cloneElement(control, {
        id,
        "aria-invalid": Boolean(errors[name]),
        "aria-describedby": errors[name] ? `${id}_error` : hint ? `${id}_hint` : undefined,
      })}
      {errors[name] ? (
        <p id={`${id}_error`} className="vx-field-error" role="alert">{t(`adminProducts.form.validation.${errors[name]}`)}</p>
      ) : (
        hint && <p id={`${id}_hint`} className="vx-field-hint">{hint}</p>
      )}
    </div>
  );

  const cover = items[0]?.url;
  const makeMain = (index) => setItems((current) => [current[index], ...current.filter((_, i) => i !== index)]);
  const removeAt = (index) => setItems((current) => current.filter((_, i) => i !== index));
  const stockNumber = Number(form.stock);

  return (
    <form id="product_form" className="vx-pf" onSubmit={submit} noValidate>
      <div className="vx-pf-main">
        <section className="vx-card vx-pf-card">
          <h2 className="vx-title-sm">{t("adminProducts.form.generalTitle")}</h2>
          <p className="vx-muted">{t("adminProducts.form.generalText")}</p>
          <div className="vx-pf-fields">
            {field(
              "name_field", "name", t("adminProducts.form.name"),
              <input type="text" className="vx-control" maxLength={120} placeholder={t("adminProducts.form.namePlaceholder")} value={form.name} onChange={set("name")} />,
              t("adminProducts.form.chars", { count: form.name.length }),
            )}
            {field(
              "seller_field", "seller", t("adminProducts.form.seller"),
              <input type="text" className="vx-control" placeholder={t("adminProducts.form.sellerPlaceholder")} value={form.seller} onChange={set("seller")} />,
            )}
            {field(
              "description_field", "description", t("adminProducts.form.description"),
              <textarea className="vx-control vx-pf-textarea" rows={7} placeholder={t("adminProducts.form.descriptionPlaceholder")} value={form.description} onChange={set("description")} />,
            )}
          </div>
        </section>

        <section className="vx-card vx-pf-card">
          <h2 className="vx-title-sm">{t("adminProducts.form.mediaTitle")}</h2>
          <p className="vx-muted">{t("adminProducts.form.mediaText")}</p>

          {items.length > 0 && (
            <div className="vx-pf-gallery">
              <ul>
                {items.map((item, index) => (
                  <li key={item.key} className={index === 0 ? "is-main" : ""}>
                    <img src={item.url} alt={t("adminProducts.form.imageAlt", { n: index + 1 })} />
                    {index === 0 && <span className="vx-pf-cover">{t("adminProducts.form.cover")}</span>}
                    {item.isNew && <span className="vx-pf-new">{t("adminProducts.form.newBadge")}</span>}
                    <div className="vx-pf-tools">
                      {index !== 0 && (
                        <button type="button" onClick={() => makeMain(index)} aria-label={t("adminProducts.form.setMainNamed", { n: index + 1 })} title={t("adminProducts.form.setMain")}>
                          <i className="fa fa-star-o" aria-hidden="true" />
                        </button>
                      )}
                      <button type="button" className="is-danger" onClick={() => removeAt(index)} aria-label={t("adminProducts.form.removeImage", { n: index + 1 })} title={t("adminProducts.form.remove")}>
                        <i className="fa fa-trash-o" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="vx-field-hint">{t(editing ? "adminProducts.form.stagedNote" : "adminProducts.form.orderNote")}</p>
            </div>
          )}

          <label className={`vx-pf-drop${errors.images ? " is-invalid" : ""}`} htmlFor="images_field">
            <i className="fa fa-cloud-upload" aria-hidden="true" />
            <span className="vx-title-sm">{t("adminProducts.form.upload")}</span>
            <span className="vx-field-hint">{t("adminProducts.form.uploadHint")}</span>
          </label>
          <input
            id="images_field"
            type="file"
            className="vx-sr-only"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            aria-describedby={errors.images ? "images_field_error" : undefined}
            onChange={onFiles}
          />
          {errors.images && <p id="images_field_error" className="vx-field-error" role="alert">{t(`adminProducts.form.validation.${errors.images}`)}</p>}
        </section>

        <section className="vx-card vx-pf-card">
          <h2 className="vx-title-sm">{t("adminProducts.form.pricingTitle")}</h2>
          <p className="vx-muted">{t("adminProducts.form.pricingText")}</p>
          <div className="vx-form-row vx-pf-fields">
            {field("price_field", "price", t("adminProducts.form.price"), <input type="number" inputMode="decimal" min="0" step="0.01" className="vx-control" value={form.price} onChange={set("price")} />)}
            {field("stock_field", "stock", t("adminProducts.form.stock"), <input type="number" inputMode="numeric" min="0" step="1" className="vx-control" value={form.stock} onChange={set("stock")} />)}
          </div>
        </section>
      </div>

      <aside className="vx-pf-side">
        <section className="vx-card vx-pf-card">
          <h2 className="vx-title-sm">{t("adminProducts.form.orgTitle")}</h2>
          <p className="vx-muted">{t("adminProducts.form.orgText")}</p>
          <div className="vx-pf-fields">
            {field(
              "category_field", "catagory", t("adminProducts.form.category"),
              <select className="vx-control" value={form.catagory} onChange={set("catagory")}>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`categories.${c}`)}</option>
                ))}
              </select>,
            )}
          </div>
        </section>

        <section className="vx-card vx-pf-card vx-pf-preview" aria-label={t("adminProducts.form.previewTitle")}>
          <h2 className="vx-title-sm">{t("adminProducts.form.previewTitle")}</h2>
          <div className="vx-pf-preview-img">{cover ? <img src={cover} alt="" /> : <i className="fa fa-picture-o" aria-hidden="true" />}</div>
          <p className="vx-title-sm">{form.name || t("adminProducts.form.previewName")}</p>
          <p className="vx-pf-preview-meta">
            <strong>{formatPrice(form.price === "" ? 0 : form.price)}</strong>
            <span className="vx-muted">{t(`categories.${form.catagory}`)}</span>
          </p>
          {Number.isFinite(stockNumber) && form.stock !== "" && <p className="vx-muted">{stockNumber === 0 ? t("adminProducts.list.out") : t("adminProducts.list.inStock", { count: stockNumber })}</p>}
        </section>

        <div className="vx-pf-actions">
          <Link to="/admin/products" className="vx-btn vx-btn--soft">{t("adminProducts.form.discard")}</Link>
          <button type="submit" className="vx-btn vx-btn--primary vx-btn--caps" disabled={loading ? true : false}>
            <i className={`fa ${editing ? "fa-floppy-o" : "fa-plus"}`} aria-hidden="true" />{" "}
            {t(editing ? (loading ? "adminProducts.form.saving" : "adminProducts.form.save") : loading ? "adminProducts.form.creating" : "adminProducts.form.create")}
          </button>
        </div>
      </aside>
    </form>
  );
}

// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FolderOpen, ImageIcon, ImagePlus, Package, Palette, Pencil, Plus, Save, Sparkles, X,
} from "lucide-react";
import { showFlash } from "@dalaillama/shared-store";
import {
  useListBrandsQuery,
  useCreateBrandMutation,
  useGetBrandQuery,
  useUpdateBrandMutation,
  useListBrandVersionsQuery,
  useGetBrandVersionQuery,
  useListBrandProjectsQuery,
  useListProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useListProductReferenceImagesQuery,
  useUploadProductReferenceImageMutation,
} from "../api/creatorEndpoints.js";

const BRAND_FIELDS = [
  { key: "brandName", label: "Brand name", required: true },
  { key: "industry", label: "Industry" },
  { key: "brandVoice", label: "Brand voice" },
  { key: "targetAudience", label: "Target audience" },
  { key: "brandValues", label: "Brand values" },
];

const BLANK_BRAND_DRAFT = { brandName: "", industry: "", brandVoice: "", targetAudience: "", brandValues: "" };

/** "Plans & Brand" -- a tenant can manage more than one brand (an agency running several client
 * brands, a solo creator with more than one business), each with its own version history (same
 * generate/edit/version-nav pattern as Script/Screenplay, just no LLM/critic source since nothing
 * here is ever generated), product library, and project list. Cast doesn't need versioning (per
 * the phased plan) and shots already regenerate from a reference image instead of needing draft
 * history -- brand context and products are the two pieces of "persistent identity" a creator
 * actually revises over time and wants to look back on. */
export default function BrandPage() {
  const { data: brands = [], isLoading: brandsLoading } = useListBrandsQuery();
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [creatingBrand, setCreatingBrand] = useState(false);

  useEffect(() => {
    if (!selectedBrandId && brands.length > 0) setSelectedBrandId(brands[0].id);
  }, [brands, selectedBrandId]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-extrabold text-white">Plans & Brand</h1>
      <p className="mt-1.5 text-sm font-medium text-slate-400">Every brand you manage, its version history, products, and projects.</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {brands.map((brand) => (
          <button
            key={brand.id}
            type="button"
            onClick={() => { setSelectedBrandId(brand.id); setCreatingBrand(false); }}
            className={`rounded-full border px-3.5 py-2 text-xs font-bold ${
              selectedBrandId === brand.id && !creatingBrand
                ? "border-purple-400/50 bg-purple-500/15 text-purple-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
            }`}
          >
            {brand.brandName}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCreatingBrand(true)}
          className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold ${
            creatingBrand ? "border-purple-400/50 bg-purple-500/15 text-purple-200" : "border-dashed border-white/20 text-slate-400 hover:text-white"
          }`}
        >
          <Plus size={13} />
          New brand
        </button>
      </div>

      {brandsLoading && <p className="mt-6 text-xs font-semibold text-slate-500">Loading…</p>}

      {!brandsLoading && brands.length === 0 && !creatingBrand && (
        <p className="mt-6 rounded-lg border border-dashed border-white/10 px-3 py-8 text-center text-xs font-semibold text-slate-500">
          No brands yet — add one to start organizing your projects and products.
        </p>
      )}

      {creatingBrand && (
        <NewBrandForm
          onCreated={(brandId) => { setSelectedBrandId(brandId); setCreatingBrand(false); }}
          onCancel={() => setCreatingBrand(false)}
        />
      )}

      {!creatingBrand && selectedBrandId && (
        <BrandDetail key={selectedBrandId} brandId={selectedBrandId} />
      )}
    </div>
  );
}

function NewBrandForm({ onCreated, onCancel }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(BLANK_BRAND_DRAFT);
  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();

  const handleCreate = async () => {
    if (!draft.brandName.trim()) {
      dispatch(showFlash({ message: "Brand name is required", type: "error" }));
      return;
    }
    try {
      const created = await createBrand(draft).unwrap();
      dispatch(showFlash({ message: "Brand created", type: "success" }));
      onCreated(created.id);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not create the brand", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-4 p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-200">
          <Palette size={16} />
        </span>
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">New brand</p>
      </div>
      <div className="space-y-3">
        {BRAND_FIELDS.map(({ key, label, required }) => (
          <div key={key}>
            <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              {label}{required && <span className="text-rose-400"> *</span>}
            </label>
            <input
              value={draft[key]}
              onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
              className="creator-input w-full px-3 py-2.5 text-[13px]"
            />
          </div>
        ))}
        <div className="flex gap-2.5 pt-1">
          <button type="button" onClick={onCancel} className="creator-control flex-1 py-2.5 text-xs font-bold text-slate-200">
            Cancel
          </button>
          <button
            type="button"
            disabled={creating}
            onClick={handleCreate}
            className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            <Save size={12} />
            {creating ? "Creating…" : "Create brand"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandDetail({ brandId }) {
  const dispatch = useDispatch();
  const [viewedVersion, setViewedVersion] = useState(null); // null = latest
  const [editingBrand, setEditingBrand] = useState(false);
  const [brandDraft, setBrandDraft] = useState(BLANK_BRAND_DRAFT);

  const { data: brand, refetch: refetchBrand } = useGetBrandQuery(brandId, { skip: !brandId });
  const { data: versions = [] } = useListBrandVersionsQuery(brandId, { skip: !brandId });
  const { data: specificVersion } = useGetBrandVersionQuery({ brandId, version: viewedVersion }, { skip: !brandId || viewedVersion == null });
  const [updateBrand, { isLoading: savingBrand }] = useUpdateBrandMutation();

  const viewed = viewedVersion == null ? brand : specificVersion;
  const versionIndex = versions.findIndex((v) => v.version === (viewedVersion == null ? brand?.currentVersion : viewedVersion));
  const canGoPrev = versionIndex > 0;
  const canGoNext = versionIndex >= 0 && versionIndex < versions.length - 1;

  useEffect(() => {
    setViewedVersion(null);
    setEditingBrand(false);
  }, [brandId]);

  const goPrev = () => canGoPrev && setViewedVersion(versions[versionIndex - 1].version);
  const goNext = () => {
    if (!canGoNext) return;
    const target = versions[versionIndex + 1];
    setViewedVersion(target.version === brand?.currentVersion ? null : target.version);
  };

  const startEditBrand = () => {
    setBrandDraft({
      brandName: viewed?.brandName || "",
      industry: viewed?.industry || "",
      brandVoice: viewed?.brandVoice || "",
      targetAudience: viewed?.targetAudience || "",
      brandValues: viewed?.brandValues || "",
    });
    setEditingBrand(true);
  };

  const handleSaveBrand = async () => {
    if (!brandDraft.brandName.trim()) {
      dispatch(showFlash({ message: "Brand name is required", type: "error" }));
      return;
    }
    try {
      await updateBrand({ brandId, ...brandDraft }).unwrap();
      dispatch(showFlash({ message: "Saved as a new brand version", type: "success" }));
      setEditingBrand(false);
      refetchBrand();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save the brand", type: "error" }));
    }
  };

  if (!brand) return null;

  return (
    <>
      <div className="creator-panel mt-4 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-500/15 text-purple-200">
              <Palette size={16} />
            </span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300">Brand</p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Every save is a new version — nothing is overwritten</p>
            </div>
          </div>

          {versions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={goPrev} disabled={!canGoPrev} className="creator-control flex h-7 w-7 items-center justify-center disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              <span className="px-1 text-xs font-bold text-slate-300">
                v{viewed?.version ?? brand?.currentVersion} of {versions.length}
              </span>
              <button type="button" onClick={goNext} disabled={!canGoNext} className="creator-control flex h-7 w-7 items-center justify-center disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {editingBrand ? (
          <div className="space-y-3">
            {BRAND_FIELDS.map(({ key, label, required }) => (
              <div key={key}>
                <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                  {label}{required && <span className="text-rose-400"> *</span>}
                </label>
                <input
                  value={brandDraft[key]}
                  onChange={(event) => setBrandDraft((current) => ({ ...current, [key]: event.target.value }))}
                  className="creator-input w-full px-3 py-2.5 text-[13px]"
                />
              </div>
            ))}
            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={() => setEditingBrand(false)} className="creator-control flex-1 py-2.5 text-xs font-bold text-slate-200">
                <X size={12} className="mr-1.5 inline" /> Cancel
              </button>
              <button
                type="button"
                disabled={savingBrand}
                onClick={handleSaveBrand}
                className="creator-primary flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                <Save size={12} />
                {savingBrand ? "Saving…" : "Save as new version"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[15px] font-bold text-white">{viewed.brandName}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5 text-[12px] font-medium text-slate-300">
              {viewed.industry && <p><span className="text-slate-500">Industry: </span>{viewed.industry}</p>}
              {viewed.brandVoice && <p><span className="text-slate-500">Voice: </span>{viewed.brandVoice}</p>}
              {viewed.targetAudience && <p className="col-span-2"><span className="text-slate-500">Audience: </span>{viewed.targetAudience}</p>}
              {viewed.brandValues && <p className="col-span-2"><span className="text-slate-500">Values: </span>{viewed.brandValues}</p>}
            </div>
            <button
              type="button"
              onClick={startEditBrand}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:border-purple-400/30"
            >
              <Pencil size={12} />
              Edit brand
            </button>
          </>
        )}
      </div>

      <ProjectsForBrand brandId={brandId} />
      <ProductLibrary brandId={brandId} />
    </>
  );
}

function ProjectsForBrand({ brandId }) {
  const { data: projects = [], isLoading } = useListBrandProjectsQuery(brandId, { skip: !brandId });

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/15 text-sky-200">
          <FolderOpen size={16} />
        </span>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-sky-300">Projects</p>
          <p className="mt-0.5 text-xs font-medium text-slate-400">Every brief created for this brand</p>
        </div>
      </div>

      {isLoading && <p className="text-xs font-semibold text-slate-500">Loading…</p>}
      {!isLoading && projects.length === 0 && (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs font-semibold text-slate-500">
          No projects for this brand yet.
        </p>
      )}
      {projects.length > 0 && (
        <div className="space-y-2">
          {projects.map((project) => (
            <a
              key={project.id}
              href={project.lockedProjectId ? `/projects/${project.lockedProjectId}` : `/requirements/${project.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-3 hover:border-sky-400/30"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-white">{project.briefText}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                  {project.durationSeconds ? `${project.durationSeconds}s · ` : ""}{project.languages?.join(", ")}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                project.funded ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-amber-400/25 bg-amber-500/10 text-amber-200"
              }`}>
                {project.funded ? "Funded" : "Awaiting funding"}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const BLANK_PRODUCT_DRAFT = { name: "", category: "", description: "" };

function ProductLibrary({ brandId }) {
  const dispatch = useDispatch();
  const { data: products = [], isLoading } = useListProductsQuery(brandId, { skip: !brandId });
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [addingProduct, setAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState(BLANK_PRODUCT_DRAFT);

  const handleCreate = async () => {
    if (!newProduct.name.trim()) {
      dispatch(showFlash({ message: "Product name is required", type: "error" }));
      return;
    }
    try {
      await createProduct({ ...newProduct, brandContextId: brandId }).unwrap();
      dispatch(showFlash({ message: "Product added", type: "success" }));
      setNewProduct(BLANK_PRODUCT_DRAFT);
      setAddingProduct(false);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not add this product", type: "error" }));
    }
  };

  return (
    <div className="creator-panel mt-6 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/15 text-teal-200">
            <Package size={16} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-teal-300">Products</p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Every project brief for this brand can pull from these</p>
          </div>
        </div>
        {!addingProduct && (
          <button
            type="button"
            onClick={() => setAddingProduct(true)}
            className="creator-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white"
          >
            <Plus size={13} />
            Add product
          </button>
        )}
      </div>

      {addingProduct && (
        <div className="mb-4 space-y-2.5 rounded-lg border border-teal-400/20 bg-teal-500/[0.04] p-4">
          <input
            value={newProduct.name}
            onChange={(event) => setNewProduct((current) => ({ ...current, name: event.target.value }))}
            placeholder="Product name"
            className="creator-input w-full px-3 py-2.5 text-[13px]"
          />
          <input
            value={newProduct.category}
            onChange={(event) => setNewProduct((current) => ({ ...current, category: event.target.value }))}
            placeholder="Category"
            className="creator-input w-full px-3 py-2.5 text-[12px]"
          />
          <textarea
            value={newProduct.description}
            onChange={(event) => setNewProduct((current) => ({ ...current, description: event.target.value }))}
            placeholder="Description"
            rows={2}
            className="creator-input w-full px-3 py-2.5 text-[12px]"
          />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setAddingProduct(false)} className="creator-control flex-1 py-2 text-xs font-bold text-slate-200">
              Cancel
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={handleCreate}
              className="creator-primary flex-1 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {creating ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs font-semibold text-slate-500">Loading…</p>}
      {!isLoading && products.length === 0 && !addingProduct && (
        <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs font-semibold text-slate-500">
          No products yet — add one so your briefs can reference it.
        </p>
      )}

      {products.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();
  const { data: images = [] } = useListProductReferenceImagesQuery(product.id);
  const [uploadImage, { isLoading: uploading }] = useUploadProductReferenceImageMutation();
  const [expanded, setExpanded] = useState(false);

  const startEdit = () => {
    setDraft({ name: product.name || "", category: product.category || "", description: product.description || "" });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProduct({ productId: product.id, ...draft }).unwrap();
      dispatch(showFlash({ message: "Product updated", type: "success" }));
      setEditing(false);
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not save this product", type: "error" }));
    }
  };

  const handleUpload = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    try {
      await uploadImage({ productId: product.id, file }).unwrap();
    } catch (error) {
      dispatch(showFlash({ message: error?.data?.message || "Could not upload this image", type: "error" }));
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      {editing ? (
        <div className="space-y-2">
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            className="creator-input w-full px-2.5 py-2 text-[13px]"
            placeholder="Product name"
          />
          <input
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
            className="creator-input w-full px-2.5 py-2 text-[11px]"
            placeholder="Category"
          />
          <textarea
            value={draft.description}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            rows={2}
            className="creator-input w-full px-2.5 py-2 text-[11px]"
            placeholder="Description"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="creator-control flex-1 py-1.5 text-[11px] font-bold text-slate-200">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="creator-primary flex-1 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold text-white">{product.name}</p>
              {product.category && <p className="text-[10px] font-semibold text-slate-500">{product.category}</p>}
            </div>
            <button type="button" onClick={startEdit} className="shrink-0 rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-white">
              <Pencil size={11} />
            </button>
          </div>
          {product.description && <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-400">{product.description}</p>}
        </>
      )}

      <div className="mt-3 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-[10px] font-extrabold uppercase tracking-wide text-slate-500"
        >
          {images.length} reference image{images.length === 1 ? "" : "s"}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {expanded && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/20">
                {img.signedUrl ? (
                  <img src={img.signedUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-600"><ImageIcon size={13} /></div>
                )}
              </div>
            ))}
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-white/20 text-slate-500 hover:border-teal-400/50 hover:text-teal-300">
              {uploading ? <Sparkles size={14} className="animate-pulse" /> : <ImagePlus size={14} />}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(event) => handleUpload(event.target.files)} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

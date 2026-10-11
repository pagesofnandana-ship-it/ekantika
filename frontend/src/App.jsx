
import { useEffect, useRef, useState } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams
} from 'react-router-dom';
import {
  ArrowRight,
  Search,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react';

import { api, authHeaders, imageUrl } from './api';

const sampleImage =
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=85';

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-light sticky-top ek-nav">
      <div className="container">
        <Link className="brand" to="/">
          ekantika<span>.</span>
          <small>THE SAREE EDIT</small>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <div className="navbar-nav mx-auto gap-lg-4">
            <NavLink className="nav-link" to="/" onClick={() => setOpen(false)}>
              Home
            </NavLink>
            <NavLink
              className="nav-link"
              to="/products"
              onClick={() => setOpen(false)}
            >
              Shop all
            </NavLink>
            <a className="nav-link" href="/#story" onClick={() => setOpen(false)}>
              Our story
            </a>
          </div>

          <Link
            className="owner-link"
            to="/admin/login"
            onClick={() => setOpen(false)}
          >
            Owner login <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container foot">
        <div>
          <Link className="brand light" to="/">
            ekantika<span>.</span>
          </Link>
          <p>Sarees that make every moment yours.</p>
        </div>
        <small>
          Made with love, for every occasion · © {new Date().getFullYear()} Ekantika
        </small>
      </div>
    </footer>
  );
}

function Card({ p }) {
  const variants = p.variants || [];
  const inStock = variants.length
    ? variants.some(v => v.available)
    : p.available;

  const cover = variants.find(v => v.available)?.images?.[0]?.image_url
    || variants[0]?.images?.[0]?.image_url
    || p.image_url;

  return (
    <article className="product-card">
      <Link className="product-img" to={`/products/${p.id}`}>
        <img src={imageUrl(cover) || sampleImage} alt={p.name} />
        <span className={inStock ? 'stock' : 'stock sold'}>
          {inStock ? 'Available' : 'Sold out'}
        </span>
      </Link>

      <div className="product-info">
        <small>{p.category}</small>
        <Link to={`/products/${p.id}`} className="product-name">
          {p.name}
        </Link>

        <div className="product-price">
          <b>₹{Number(p.price).toLocaleString('en-IN')}</b>
          <Link to={`/products/${p.id}`}>
            View <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/products')
      .then(setItems)
      .catch(() => setError('Could not load products. Please try again later.'));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              ✦ &nbsp; A LITTLE TRADITION, A LOT OF YOU
            </div>
            <h1>
              Every saree
              <br />
              tells a <em>story.</em>
            </h1>
            <p>
              Thoughtfully chosen drapes for the moments you want to remember.
              Find the one that feels like you.
            </p>
            <Link className="btn btn-main" to="/products">
              Explore the collection <ArrowRight size={17} />
            </Link>
            <div className="hero-note">
              — &nbsp; Timeless drapes. Personal stories.
            </div>
          </div>

          <div className="hero-art">
            <img src={sampleImage} alt="Traditional saree" />
            <div className="hero-label">
              <small>THE EKANTIKA EDIT</small>
              <strong>Tradition, beautifully reimagined.</strong>
            </div>
            <div className="stamp">
              MADE FOR
              <br />
              YOUR MOMENTS
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">CURATED FOR YOU</div>
            <h2>
              Find your <em>favourite.</em>
            </h2>
          </div>
          <Link className="under-link" to="/products">
            View all sarees <ArrowRight size={15} />
          </Link>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {!error && !items.length && (
          <p className="muted">
            Your collection is getting ready. Add sarees through the owner dashboard.
          </p>
        )}

        <div className="row g-4">
          {items.slice(0, 4).map(p => (
            <div className="col-6 col-lg-3" key={p.id}>
              <Card p={p} />
            </div>
          ))}
        </div>
      </section>

      <section id="story" className="story">
        <div className="container story-inner">
          <div className="story-mark">e.</div>
          <div>
            <div className="eyebrow">THE HEART OF EKANTIKA</div>
            <h2>
              Not just a saree.
              <br />
              <em>A feeling you carry.</em>
            </h2>
            <p>
              We believe the right drape can hold a memory, celebrate a milestone,
              or make an ordinary day feel special. Explore our collection and let
              your next story begin.
            </p>
            <Link className="under-link" to="/products">
              Discover the collection <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Products() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/products?available=all')
      .then(setItems)
      .catch(e => setError(e.message));
  }, []);

  const cats = ['All', ...new Set(items.map(p => p.category).filter(Boolean))];

  const visible = items.filter(p => {
    const variants = (p.variants || [])
      .map(v => `${v.color} ${v.description}`)
      .join(' ');

    const searchable = [
      p.name,
      p.description,
      p.fabric,
      p.color,
      variants
    ].join(' ').toLowerCase();

    return (cat === 'All' || p.category === cat)
      && searchable.includes(search.toLowerCase());
  });

  return (
    <main className="container page">
      <div className="eyebrow">THE COLLECTION</div>
      <h1>
        Sarees for <em>every story.</em>
      </h1>
      <p className="muted">
        Browse the edit, find your favourite, and message us to make it yours.
      </p>

      <div className="catalog-tools">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Search sarees, fabric, colour..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filters">
          {cats.map(c => (
            <button
              key={c}
              className={cat === c ? 'active' : ''}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="row g-4">
        {visible.map(p => (
          <div className="col-6 col-md-4 col-lg-3" key={p.id}>
            <Card p={p} />
          </div>
        ))}
      </div>

      {!error && !visible.length && (
        <div className="empty">
          <ShoppingBag />
          <h3>No sarees found just yet</h3>
          <p>Try another search, or check back soon.</p>
        </div>
      )}
    </main>
  );
}

function Detail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [settings, setSettings] = useState({});
  const [error, setError] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    setP(null);
    setError('');

    Promise.all([
      api(`/api/products/${id}`),
      api('/api/settings')
    ])
      .then(([product, storeSettings]) => {
        setP(product);
        setSettings(storeSettings);

        const first = product.variants?.[0];
        setSelectedVariantId(first ? String(first.id) : '');
        setSelectedImage(
          first?.images?.[0]?.image_url || product.image_url || ''
        );
      })
      .catch(e => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="container page">
        <div className="alert alert-warning">{error}</div>
        <Link to="/products">Back to collection</Link>
      </main>
    );
  }

  if (!p) return <main className="container page">Loading…</main>;

  const variants = p.variants || [];
  const hasVariants = variants.length > 0;

  const selectedVariant = hasVariants
    ? variants.find(v => String(v.id) === selectedVariantId) || variants[0]
    : null;

  const photos = selectedVariant?.images?.length
    ? selectedVariant.images
    : (!hasVariants && p.image_url
        ? [{ id: 'main', image_url: p.image_url }]
        : []);

  const activeImage =
    photos.find(img => img.image_url === selectedImage)?.image_url
    || photos[0]?.image_url
    || p.image_url;

  const available = hasVariants
    ? Boolean(selectedVariant?.available)
    : Boolean(p.available);

  const number = (settings.whatsapp_number || '').replace(/\D/g, '');
  const productUrl = `${window.location.origin}/products/${p.id}`;

  const message = [
    "Hello Ekantika! I'm interested in this saree.",
    '',
    `Product: ${p.name}`,
    `Product ID: EKA${String(p.id).padStart(3, '0')}`,
    `Price: ₹${Number(p.price).toLocaleString('en-IN')}`,
    selectedVariant ? `Colour: ${selectedVariant.color}` : '',
    selectedVariant?.description || p.description || '',
    '',
    `View product: ${productUrl}`,
    '',
    `Is the ${selectedVariant?.color || 'selected'} colour available?`
  ].filter(Boolean).join('\n');

  const whatsappUrl = number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <main className="container page">
      <p className="muted small">
        <Link to="/">Home</Link> / <Link to="/products">Collection</Link> / {p.name}
      </p>

      <div className="row g-5 detail">
        <div className="col-md-6">
          <img
            className="detail-img"
            src={imageUrl(activeImage) || sampleImage}
            alt={`${p.name}${selectedVariant ? ` - ${selectedVariant.color}` : ''}`}
          />

          {photos.length > 1 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {photos.map(img => (
                <button
                  type="button"
                  key={img.id}
                  aria-label="View product photo"
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    padding: 0,
                    border: selectedImage === img.image_url
                      ? '2px solid #795548'
                      : '1px solid #ddd',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'white'
                  }}
                >
                  <img
                    src={imageUrl(img.image_url)}
                    alt=""
                    style={{
                      width: 75,
                      height: 90,
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-6 detail-copy">
          <div className="eyebrow">{p.category}</div>
          <h1>{p.name}</h1>
          <div className="detail-price">
            ₹{Number(p.price).toLocaleString('en-IN')}
          </div>

          {hasVariants && (
            <div className="mt-4">
              <label className="form-label fw-semibold">Choose colour</label>
              <div className="d-flex flex-wrap gap-2">
                {variants.map(v => (
                  <button
                    type="button"
                    key={v.id}
                    className={`btn ${
                      String(selectedVariant.id) === String(v.id)
                        ? 'btn-dark'
                        : 'btn-outline-dark'
                    }`}
                    onClick={() => {
                      setSelectedVariantId(String(v.id));
                      setSelectedImage(v.images?.[0]?.image_url || '');
                    }}
                  >
                    {v.color}{!v.available ? ' · Out of Stock' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="muted description mt-3">
            {selectedVariant?.description
              || p.description
              || 'A beautiful addition to your wardrobe.'}
          </p>

          <div className="specs">
            {p.fabric && (
              <div><span>FABRIC</span><b>{p.fabric}</b></div>
            )}

            {selectedVariant && (
              <div><span>COLOUR</span><b>{selectedVariant.color}</b></div>
            )}

            {!hasVariants && p.color && (
              <div><span>COLOUR</span><b>{p.color}</b></div>
            )}

            <div>
              <span>AVAILABILITY</span>
              <b>{available ? 'In Stock' : 'Out of Stock'}</b>
            </div>
          </div>

          {available ? (
            <a
              className="btn btn-main w-100 mt-4"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              Enquire / order on WhatsApp <ArrowRight size={17} />
            </a>
          ) : (
            <button disabled className="btn btn-secondary w-100 mt-4">
              This colour is currently out of stock
            </button>
          )}

          {!number && (
            <p className="small muted mt-2">
              The owner WhatsApp number is not set yet.
            </p>
          )}

          <p className="small muted mt-3">
            No online payment needed. We will confirm availability and delivery details directly.
          </p>
        </div>
      </div>
    </main>
  );
}

function Login() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');

    try {
      const r = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      localStorage.setItem('ekantika_token', r.access_token);
      localStorage.setItem('ekantika_user', r.username);
      nav('/admin');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <Link className="brand" to="/">ekantika<span>.</span></Link>
        <div className="eyebrow mt-4">OWNER ACCESS</div>
        <h1>Welcome <em>back.</em></h1>
        <p className="muted">Sign in to manage your saree collection.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <label className="form-label">Username</label>
        <input
          className="form-control"
          value={username}
          onChange={e => setU(e.target.value)}
          required
        />

        <label className="form-label mt-3">Password</label>
        <input
          className="form-control"
          type="password"
          value={password}
          onChange={e => setP(e.target.value)}
          required
        />

        <button className="btn btn-main w-100 mt-4">Sign in</button>
        <Link className="back" to="/">← Back to website</Link>
      </form>
    </main>
  );
}

function Admin() {
  const nav = useNavigate();
  const empty = {
    name: '',
    price: '',
    description: '',
    category: 'Traditional',
    fabric: '',
    color: '',
    available: true
  };

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [edit, setEdit] = useState(null);
  const [file, setFile] = useState(null);
  const [wa, setWa] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const imageInputRef = useRef(null);

  const [variantProductId, setVariantProductId] = useState('');
  const [variantEditId, setVariantEditId] = useState(null);
  const [variantColor, setVariantColor] = useState('');
  const [variantDescription, setVariantDescription] = useState('');
  const [variantAvailable, setVariantAvailable] = useState(true);
  const [variantFiles, setVariantFiles] = useState([]);

  const headers = authHeaders();

  async function load() {
    try {
      const [products, settings] = await Promise.all([
        api('/api/products?available=all'),
        api('/api/settings')
      ]);
      setItems(products);
      setWa(settings.whatsapp_number || '');
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('ekantika_token')) {
      nav('/admin/login');
    } else {
      load();
    }
  }, []);

  function set(k, v) {
    setForm(old => ({ ...old, [k]: v }));
  }

  function reset() {
    setForm({ ...empty });
    setEdit(null);
    setFile(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setNotice('');

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, String(v)));
    if (file) body.append('image', file);

    try {
      await api(edit
        ? `/api/admin/products/${edit}`
        : '/api/admin/products', {
        method: edit ? 'PUT' : 'POST',
        headers,
        body
      });

      setNotice(edit ? 'Product updated.' : 'Product added.');
      reset();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function del(id) {
    if (!window.confirm('Delete this product and all its colour variants?')) return;

    try {
      await api(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers
      });
      setNotice('Product deleted.');
      if (variantProductId === String(id)) setVariantProductId('');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveWa(e) {
    e.preventDefault();
    setError('');

    try {
      const r = await api('/api/admin/settings/whatsapp', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: wa })
      });
      setWa(r.whatsapp_number);
      setNotice('WhatsApp number saved.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveVariant(e) {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!variantProductId) {
      setError('Select a product first.');
      return;
    }

    if (!variantEditId && variantFiles.length === 0) {
      setError('Upload at least one photo for this colour.');
      return;
    }

    const body = new FormData();
    body.append('color', variantColor);
    body.append('description', variantDescription);
    body.append('available', String(variantAvailable));

    Array.from(variantFiles).forEach(f => body.append('images', f));

    try {
      await api(
        variantEditId
          ? `/api/admin/variants/${variantEditId}`
          : `/api/admin/products/${variantProductId}/variants`,
        {
          method: variantEditId ? 'PUT' : 'POST',
          headers,
          body
        }
      );

      setNotice(variantEditId ? 'Colour updated.' : 'Colour added.');
      clearVariantForm();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function clearVariantForm() {
    setVariantEditId(null);
    setVariantColor('');
    setVariantDescription('');
    setVariantAvailable(true);
    setVariantFiles([]);
    const input = document.getElementById('variant-images');
    if (input) input.value = '';
  }

  function startVariantEdit(product, variant) {
    setVariantProductId(String(product.id));
    setVariantEditId(variant.id);
    setVariantColor(variant.color);
    setVariantDescription(variant.description || '');
    setVariantAvailable(variant.available);
    setVariantFiles([]);

    const input = document.getElementById('variant-images');
    if (input) input.value = '';

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  async function toggleVariantStock(variant) {
    const body = new FormData();
    body.append('color', variant.color);
    body.append('description', variant.description || '');
    body.append('available', String(!variant.available));

    try {
      await api(`/api/admin/variants/${variant.id}`, {
        method: 'PUT',
        headers,
        body
      });

      setNotice(
        `${variant.color} marked ${variant.available ? 'Out of Stock' : 'In Stock'}.`
      );
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeVariant(variant) {
    if (!window.confirm(`Delete ${variant.color} and all its photos?`)) return;

    try {
      await api(`/api/admin/variants/${variant.id}`, {
        method: 'DELETE',
        headers
      });
      setNotice(`${variant.color} variant deleted.`);
      if (variantEditId === variant.id) clearVariantForm();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeVariantImage(img, variant) {
    if (!window.confirm('Remove this photo?')) return;

    try {
      await api(`/api/admin/variant-images/${img.id}`, {
        method: 'DELETE',
        headers
      });
      setNotice('Photo removed.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function logout() {
    localStorage.removeItem('ekantika_token');
    localStorage.removeItem('ekantika_user');
    nav('/admin/login');
  }

  return (
    <main className="container admin-page">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">EKANTIKA / CONTROL ROOM</div>
          <h1>Product <em>studio.</em></h1>
          <p className="muted">
            Hello, {localStorage.getItem('ekantika_user') || 'Admin'}.
            Manage your collection.
          </p>
        </div>
        <button className="btn btn-outline-dark" onClick={logout}>Log out</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="row g-4">
        <div className="col-lg-5">
          <section className="panel">
            <div className="eyebrow">{edit ? 'EDIT LISTING' : 'NEW LISTING'}</div>
            <h2>{edit ? 'Edit a saree' : 'Add a saree'}</h2>

            <form onSubmit={save}>
              <label className="form-label">Product name *</label>
              <input
                className="form-control"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />

              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step=".01"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Category</label>
                  <input
                    className="form-control"
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                  />
                </div>
              </div>

              <label className="form-label mt-3">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />

              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="form-label">Fabric</label>
                  <input
                    className="form-control"
                    value={form.fabric}
                    onChange={e => set('fabric', e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Legacy colour</label>
                  <input
                    className="form-control"
                    value={form.color}
                    onChange={e => set('color', e.target.value)}
                  />
                </div>
              </div>

              <label className="form-label mt-3">Main image (optional)</label>
              <input
                ref={imageInputRef}
                className="form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />

              <div className="form-check mt-3">
                <input
                  id="available"
                  className="form-check-input"
                  type="checkbox"
                  checked={form.available}
                  onChange={e => set('available', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="available">
                  Available for order (used when no colour variants exist)
                </label>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-main flex-grow-1">
                  {edit ? 'Save changes' : 'Add product'}
                </button>
                {edit && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={reset}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="panel mt-4">
            <div className="eyebrow">CUSTOMER ENQUIRIES</div>
            <h2>WhatsApp contact</h2>
            <p className="muted small">Country code + mobile number, digits only.</p>

            <form onSubmit={saveWa}>
              <input
                className="form-control"
                value={wa}
                onChange={e => setWa(e.target.value)}
                placeholder="919876543210"
              />
              <button className="btn btn-outline-dark mt-3">Save number</button>
            </form>
          </section>
        </div>

        <div className="col-lg-7">
          <section className="panel">
            <div className="panel-title">
              <div className="eyebrow">YOUR INVENTORY</div>
              <h2>All products <small>{items.length}</small></h2>
            </div>

            {!items.length ? (
              <p className="muted">No products yet. Add your first saree.</p>
            ) : items.map(p => (
              <div className="inventory-row" key={p.id}>
                <img src={imageUrl(p.image_url) || sampleImage} alt={p.name} />

                <div className="inventory-text">
                  <b>{p.name}</b>
                  <span>₹{Number(p.price).toLocaleString('en-IN')} · {p.category}</span>
                  <span className={p.available ? 'green' : 'red'}>
                    {p.available ? 'Available' : 'Sold out'}
                  </span>
                  <span className="small">
                    {(p.variants || []).length} colour variant(s)
                  </span>
                </div>

                <div className="actions">
                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => {
                      setEdit(p.id);
                      setForm({
                        name: p.name,
                        price: String(p.price),
                        description: p.description || '',
                        category: p.category || 'Traditional',
                        fabric: p.fabric || '',
                        color: p.color || '',
                        available: p.available
                      });
                      setFile(null);
                      if (imageInputRef.current) imageInputRef.current.value = '';
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => {
                      setVariantProductId(String(p.id));
                      clearVariantForm();
                      document.getElementById('variant-manager')?.scrollIntoView({
                        behavior: 'smooth'
                      });
                    }}
                  >
                    Colours
                  </button>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => del(p.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="panel mt-4" id="variant-manager">
            <div className="eyebrow">COLOUR & PHOTO MANAGEMENT</div>
            <h2>Colour variants</h2>
            <p className="muted">
              Each colour has its own description, photos and stock status.
            </p>

            <label className="form-label">Choose product</label>
            <select
              className="form-select"
              value={variantProductId}
              onChange={e => {
                setVariantProductId(e.target.value);
                clearVariantForm();
              }}
            >
              <option value="">Select a product</option>
              {items.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <form onSubmit={saveVariant} className="mt-3">
              <h3 className="h5">
                {variantEditId ? 'Edit colour' : 'Add a colour'}
              </h3>

              <label className="form-label">Colour name *</label>
              <input
                className="form-control"
                value={variantColor}
                onChange={e => setVariantColor(e.target.value)}
                placeholder="e.g. Emerald Green"
                required
              />

              <label className="form-label mt-3">Colour description</label>
              <textarea
                className="form-control"
                rows="3"
                value={variantDescription}
                onChange={e => setVariantDescription(e.target.value)}
                placeholder="Describe this colour's fabric, border and detailing"
              />

              <label className="form-label mt-3">
                Photos {variantEditId ? '(optional: add more)' : '(select multiple)'}
              </label>
              <input
                id="variant-images"
                className="form-control"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={e => setVariantFiles(e.target.files || [])}
              />

              {variantFiles.length > 0 && (
                <p className="small muted mt-2">
                  {variantFiles.length} photo(s) selected.
                </p>
              )}

              <div className="form-check mt-3">
                <input
                  id="variant-available"
                  className="form-check-input"
                  type="checkbox"
                  checked={variantAvailable}
                  onChange={e => setVariantAvailable(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="variant-available">
                  In Stock
                </label>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-main"
                  type="submit"
                  disabled={!variantProductId}
                >
                  {variantEditId ? 'Save colour' : 'Add colour'}
                </button>

                {variantEditId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearVariantForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <hr />
            <h3 className="h5">Existing colours</h3>

            {!variantProductId ? (
              <p className="muted">Select a product to see its colours.</p>
            ) : (
              (items.find(p => String(p.id) === variantProductId)?.variants || [])
                .map(v => (
                  <div className="border rounded p-3 mt-3" key={v.id}>
                    <div className="d-flex justify-content-between gap-2 flex-wrap">
                      <div>
                        <strong>{v.color}</strong>
                        <div className={v.available ? 'green' : 'red'}>
                          {v.available ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>

                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark"
                          onClick={() => startVariantEdit(
                            items.find(p => String(p.id) === variantProductId),
                            v
                          )}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleVariantStock(v)}
                        >
                          {v.available ? 'Mark Out of Stock' : 'Mark In Stock'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeVariant(v)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {v.description && (
                      <p className="small mt-2">{v.description}</p>
                    )}

                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {v.images.map(img => (
                        <div key={img.id}>
                          <img
                            src={imageUrl(img.image_url)}
                            alt={v.color}
                            style={{
                              width: 75,
                              height: 90,
                              objectFit: 'cover',
                              borderRadius: 6
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger d-block"
                            onClick={() => removeVariantImage(img, v)}
                          >
                            Remove photo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<Detail />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="*"
          element={
            <main className="container page">
              <h1>Page not found</h1>
              <Link to="/">Go home</Link>
            </main>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

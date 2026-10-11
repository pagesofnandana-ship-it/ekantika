import os, re
from decimal import Decimal, InvalidOperation
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy.engine import URL
load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "change-me")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "change-me-too")
db_host = os.getenv("DB_HOST")

if db_host:
    app.config["SQLALCHEMY_DATABASE_URI"] = URL.create(
        "mysql+pymysql",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=db_host,
        port=int(os.getenv("DB_PORT", "15231")),
        database=os.getenv("DB_NAME", "defaultdb"),
        query={"charset": "utf8mb4"},
    )

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "connect_args": {
            "ssl": {
                "ca": os.path.join(
                    os.path.dirname(__file__), "ca.pem"
                )
            }
        }
    }
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost/ekantika_db?charset=utf8mb4"
    )

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")}})
db = SQLAlchemy(app)
jwt = JWTManager(app)
ALLOWED = {"jpg", "jpeg", "png", "webp"}

class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text, default="")
    category = db.Column(db.String(100), default="Sarees")
    fabric = db.Column(db.String(100), default="")
    color = db.Column(db.String(80), default="")
    image_filename = db.Column(db.String(255))
    available = db.Column(db.Boolean, default=True, nullable=False)
    variants = db.relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy=True
    )
    def public(self):
        return {"id": self.id, "name": self.name, "price": float(self.price),
                "description": self.description or "", "category": self.category or "Sarees",
                "fabric": self.fabric or "", "color": self.color or "",
                "image_url": f"/uploads/{self.image_filename}" if self.image_filename else None,
                "available": self.available,
                "variants": [variant.public() for variant in self.variants]}
class ProductVariant(db.Model):
    __tablename__ = "product_variants"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(
        db.Integer,
        db.ForeignKey("product.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    color = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, default="")
    available = db.Column(db.Boolean, default=True, nullable=False)

    product = db.relationship(
        "Product",
        back_populates="variants"
    )

    images = db.relationship(
        "VariantImage",
        back_populates="variant",
        cascade="all, delete-orphan",
        order_by="VariantImage.id",
        lazy=True
    )

    def public(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "color": self.color,
            "description": self.description or "",
            "available": self.available,
            "images": [
                {
                    "id": image.id,
                    "image_url": f"/uploads/{image.image_filename}"
                }
                for image in self.images
            ]
        }


class VariantImage(db.Model):
    __tablename__ = "variant_images"

    id = db.Column(db.Integer, primary_key=True)
    variant_id = db.Column(
        db.Integer,
        db.ForeignKey("product_variants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    image_filename = db.Column(db.String(255), nullable=False)

    variant = db.relationship(
        "ProductVariant",
        back_populates="images"
    )
class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(80), unique=True, nullable=False)
    value = db.Column(db.String(255), default="", nullable=False)

with app.app_context():
    db.create_all()
    if not Setting.query.filter_by(key="whatsapp_number").first():
        db.session.add(Setting(key="whatsapp_number", value=os.getenv("WHATSAPP_NUMBER", "")))
        db.session.commit()

def fail(message, status=400):
    return jsonify({"error": message}), status

def owner_only(fn):
    @wraps(fn)
    @jwt_required()
    def wrapped(*args, **kwargs):
        try:
            admin = db.session.get(Admin, int(get_jwt_identity()))
        except (TypeError, ValueError):
            admin = None
        if not admin:
            return fail("Admin login required.", 401)
        return fn(*args, **kwargs)
    return wrapped

def current_whatsapp():
    row = Setting.query.filter_by(key="whatsapp_number").first()
    return row.value if row else ""

def parse_fields(data):
    name = str(data.get("name", "")).strip()
    if not name:
        raise ValueError("Product name is required.")
    try:
        price = Decimal(str(data.get("price", "")).strip())
        if price < 0:
            raise InvalidOperation
    except (InvalidOperation, ValueError):
        raise ValueError("Enter a valid non-negative price.")
    return dict(name=name, price=price,
                description=str(data.get("description", "")).strip(),
                category=str(data.get("category", "Sarees")).strip() or "Sarees",
                fabric=str(data.get("fabric", "")).strip(),
                color=str(data.get("color", "")).strip(),
                available=str(data.get("available", "true")).lower() in {"true", "1", "yes", "on"})

def save_image(file):
    if not file or not file.filename:
        return None
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED:
        raise ValueError("Use a JPG, PNG or WEBP image.")
    filename = os.urandom(8).hex() + "_" + secure_filename(file.filename)
    file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    return filename

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "store": "Ekantika"})

@app.get("/api/settings")
def settings():
    return jsonify({"store_name": "Ekantika", "whatsapp_number": current_whatsapp()})

@app.get("/api/products")
def products():
    q = Product.query
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "")
    if search:
        term = f"%{search}%"
        q = q.filter(db.or_(Product.name.ilike(term), Product.description.ilike(term),
                            Product.category.ilike(term), Product.fabric.ilike(term)))
    if category and category.lower() != "all":
        q = q.filter_by(category=category)
    if request.args.get("available") != "all":
        q = q.filter_by(available=True)
    return jsonify([p.public() for p in q.order_by(Product.id.desc()).all()])

@app.get("/api/products/<int:pid>")
def product_detail(pid):
    p = db.session.get(Product, pid)
    return (jsonify(p.public()), 200) if p else fail("Product not found.", 404)

@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    admin = Admin.query.filter_by(username=str(data.get("username", "")).strip()).first()
    if not admin or not check_password_hash(admin.password_hash, data.get("password", "")):
        return fail("Invalid username or password.", 401)
    return jsonify({"access_token": create_access_token(identity=str(admin.id)), "username": admin.username})

@app.post("/api/admin/products")
@owner_only
def add_product():
    try:
        fields = parse_fields(request.form if request.form else (request.get_json(silent=True) or {}))
        filename = save_image(request.files.get("image"))
    except ValueError as e:
        return fail(str(e))
    p = Product(**fields, image_filename=filename)
    db.session.add(p); db.session.commit()
    return jsonify(p.public()), 201

@app.put("/api/admin/products/<int:pid>")
@owner_only
def edit_product(pid):
    p = db.session.get(Product, pid)
    if not p:
        return fail("Product not found.", 404)
    try:
        fields = parse_fields(request.form if request.form else (request.get_json(silent=True) or {}))
        filename = save_image(request.files.get("image"))
    except ValueError as e:
        return fail(str(e))
    for k, v in fields.items():
        setattr(p, k, v)
    if filename:
        old = p.image_filename
        p.image_filename = filename
        if old:
            try: os.remove(os.path.join(app.config["UPLOAD_FOLDER"], old))
            except OSError: pass
    db.session.commit()
    return jsonify(p.public())
@app.post("/api/admin/products/<int:pid>/variants")
@owner_only
def add_variant(pid):
    product = db.session.get(Product, pid)
    if not product:
        return fail("Product not found.", 404)

    color = request.form.get("color", "").strip()
    description = request.form.get("description", "").strip()
    available = request.form.get("available", "true").lower() in {
        "true", "1", "yes", "on"
    }

    if not color:
        return fail("Colour name is required.")

    files = [f for f in request.files.getlist("images") if f.filename]

    if not files:
        return fail("Upload at least one image for this colour.")

    saved_files = []

    try:
        for file in files:
            filename = save_image(file)
            if filename:
                saved_files.append(filename)

        variant = ProductVariant(
            product_id=pid,
            color=color,
            description=description,
            available=available
        )
        db.session.add(variant)
        db.session.flush()

        for filename in saved_files:
            db.session.add(
                VariantImage(
                    variant_id=variant.id,
                    image_filename=filename
                )
            )

        db.session.commit()
        return jsonify(variant.public()), 201

    except ValueError as e:
        db.session.rollback()
        for filename in saved_files:
            try:
                os.remove(os.path.join(
                    app.config["UPLOAD_FOLDER"], filename
                ))
            except OSError:
                pass
        return fail(str(e))

    except Exception:
        db.session.rollback()
        for filename in saved_files:
            try:
                os.remove(os.path.join(
                    app.config["UPLOAD_FOLDER"], filename
                ))
            except OSError:
                pass
        app.logger.exception("Could not create product variant")
        return fail("Could not save the colour variant.", 500)


@app.put("/api/admin/variants/<int:vid>")
@owner_only
def edit_variant(vid):
    variant = db.session.get(ProductVariant, vid)
    if not variant:
        return fail("Colour variant not found.", 404)

    color = request.form.get("color", variant.color).strip()
    description = request.form.get(
        "description", variant.description or ""
    ).strip()

    if not color:
        return fail("Colour name is required.")

    if "available" in request.form:
        available = request.form["available"].lower() in {
            "true", "1", "yes", "on"
        }
        variant.available = available

    variant.color = color
    variant.description = description

    files = [f for f in request.files.getlist("images") if f.filename]
    saved_files = []

    try:
        for file in files:
            filename = save_image(file)
            if filename:
                saved_files.append(filename)

        for filename in saved_files:
            db.session.add(
                VariantImage(
                    variant_id=vid,
                    image_filename=filename
                )
            )

        db.session.commit()
        return jsonify(variant.public())

    except ValueError as e:
        db.session.rollback()
        for filename in saved_files:
            try:
                os.remove(os.path.join(
                    app.config["UPLOAD_FOLDER"], filename
                ))
            except OSError:
                pass
        return fail(str(e))

    except Exception:
        db.session.rollback()
        app.logger.exception("Could not update product variant")
        return fail("Could not update the colour variant.", 500)


@app.delete("/api/admin/variants/<int:vid>")
@owner_only
def delete_variant(vid):
    variant = db.session.get(ProductVariant, vid)
    if not variant:
        return fail("Colour variant not found.", 404)

    filenames = [image.image_filename for image in variant.images]

    db.session.delete(variant)
    db.session.commit()

    for filename in filenames:
        try:
            os.remove(os.path.join(
                app.config["UPLOAD_FOLDER"], filename
            ))
        except OSError:
            pass

    return jsonify({"message": "Colour variant deleted."})


@app.delete("/api/admin/variant-images/<int:image_id>")
@owner_only
def delete_variant_image(image_id):
    image = db.session.get(VariantImage, image_id)
    if not image:
        return fail("Image not found.", 404)

    # Keep at least one image for every variant.
    if len(image.variant.images) <= 1:
        return fail("A colour must have at least one image.")

    filename = image.image_filename
    db.session.delete(image)
    db.session.commit()

    try:
        os.remove(os.path.join(
            app.config["UPLOAD_FOLDER"], filename
        ))
    except OSError:
        pass

    return jsonify({"message": "Image removed."})
@app.delete("/api/admin/products/<int:pid>")
@owner_only
def delete_product(pid):
    p = db.session.get(Product, pid)
    if not p:
        return fail("Product not found.", 404)

    filenames = []

    if p.image_filename:
        filenames.append(p.image_filename)

    for variant in p.variants:
        filenames.extend(
            image.image_filename for image in variant.images
        )

    db.session.delete(p)
    db.session.commit()

    for filename in filenames:
        try:
            os.remove(os.path.join(
                app.config["UPLOAD_FOLDER"], filename
            ))
        except OSError:
            pass

    return jsonify({"message": "Product deleted."})

@app.put("/api/admin/settings/whatsapp")
@owner_only
def update_whatsapp():
    data = request.get_json(silent=True) or {}
    number = re.sub(r"\D", "", str(data.get("whatsapp_number", "")))
    if number and not 8 <= len(number) <= 15:
        return fail("Enter a valid international number with country code.")
    row = Setting.query.filter_by(key="whatsapp_number").first()
    if not row:
        db.session.add(Setting(key="whatsapp_number", value=number))
    else:
        row.value = number
    db.session.commit()
    return jsonify({"whatsapp_number": number})

@app.get("/uploads/<path:filename>")
def uploaded(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.cli.command("create-admin")
def create_admin():
    username = input("Admin username: ").strip()
    password = input("Admin password (minimum 10 characters): ")
    if not username or len(password) < 10:
        print("Username is required; password must be at least 10 characters."); return
    if Admin.query.filter_by(username=username).first():
        print("Username already exists."); return
    admin = Admin(username=username, password_hash=generate_password_hash(password))
    db.session.add(admin); db.session.commit()
    print("Admin created successfully.")

if __name__ == "__main__":
    app.run(debug=True)

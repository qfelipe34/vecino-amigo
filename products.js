// products.js
// =========================================================================
//  CONFIGURACIÓN DE LA TIENDA
// =========================================================================
// Modificá estos datos según tus necesidades.
// - whatsappNumber: Debe ser el número telefónico sin símbolos (+, - o espacios).
//   Por ejemplo, para Argentina: 549 + código de área sin el 15 + número.
// - sellerName: Nombre o forma en que te identificás como vendedor.
const STORE_CONFIG = {
  sellerName: "Vecino Amigo",
  whatsappNumber: "5491123456789", 
  currencySymbol: "$",
  sheetApiUrl: "https://script.google.com/macros/s/AKfycbw1qUoMEBtwBA96ij6SZZowaXqkixlVLyxWrFy7PssXpNaBrhiZloOrZdLwcWL-nfzI/exec" // Pegar aquí la URL de la Web App de Google Apps Script
};

// =========================================================================
//  CATÁLOGO DE PRODUCTOS (Configurable)
// =========================================================================
// Para agregar un producto nuevo, copia uno existente y modifícalo.
// Estructura de campos:
// - id: Identificador único del producto (sin espacios ni acentos, ej: "arroz-gallo").
// - name: Nombre comercial del producto.
// - brand: Marca del producto (sirve para los filtros de búsqueda).
// - weight: Contenido neto / peso (ej: "500g", "1L").
// - officialPrice: Precio de Coto Online (se mostrará tachado).
// - price: Tu precio con descuento para el vecino (precio final de venta).
// - inStock: true (si tenés stock) o false (si está agotado).
// - image: URL de la imagen del producto (podés usar imágenes de internet).
// - description: Una descripción breve para tentar a tu comprador.
const PRODUCTS_CATALOG = [
  {
    id: "gallo-doble-carolina-1kg",
    name: "Arroz Doble Carolina Gallo",
    brand: "Gallo",
    weight: "1kg",
    officialPrice: 2800,
    price: 2400,
    inStock: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    description: "Arroz de grano corto y ancho, ideal para preparar risottos, guisos y arroz con leche."
  },
  {
    id: "exquisita-vainilla-540g",
    name: "Bizcochuelo Exquisita Vainilla",
    brand: "Exquisita",
    weight: "540g",
    officialPrice: 2100,
    price: 1800,
    inStock: true,
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80",
    description: "Premezcla para preparar un bizcochuelo súper esponjoso y con el más rico aroma a vainilla."
  },
  {
    id: "cruz-de-malta-1kg",
    name: "Yerba Mate Cruz de Malta",
    brand: "Cruz de Malta",
    weight: "1kg",
    officialPrice: 3800,
    price: 3300,
    inStock: true,
    image: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80",
    description: "Yerba mate elaborada con palo, de sabor suave y duradero para disfrutar de tus mates todo el día."
  },
  {
    id: "preferido-pan-rallado-500g",
    name: "Pan Rallado Preferido",
    brand: "Preferido",
    weight: "500g",
    officialPrice: 1400,
    price: 1150,
    inStock: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    description: "El pan rallado clásico para lograr rebozados dorados y milanesas súper crujientes."
  },
  {
    id: "lira-aceite-vegetal-900ml",
    name: "Aceite Mezcla Lira",
    brand: "Lira",
    weight: "900ml",
    officialPrice: 2100,
    price: 1750,
    inStock: true,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    description: "Aceite mezcla vegetal ideal tanto para aderezar ensaladas como para freír y cocinar."
  },
  {
    id: "blancaflor-leudante-1kg",
    name: "Harina Leudante Blancaflor",
    brand: "Blancaflor",
    weight: "1kg",
    officialPrice: 1600,
    price: 1300,
    inStock: true,
    image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=600&auto=format&fit=crop&q=80",
    description: "La harina leudante tradicional del paquete azul, perfecta para bizcochuelos, tortas y muffins."
  },
  {
    id: "favorita-harina-0000-1kg",
    name: "Harina de Trigo 0000 Favorita",
    brand: "Favorita",
    weight: "1kg",
    officialPrice: 1350,
    price: 1100,
    inStock: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
    description: "Harina refinada extra blanca y fina, ideal para repostería, masas finas, salsas y panadería."
  },
  {
    id: "matarazzo-spaghetti-500g",
    name: "Fideos Spaghetti Matarazzo",
    brand: "Matarazzo",
    weight: "500g",
    officialPrice: 1900,
    price: 1650,
    inStock: true,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80",
    description: "Fideos spaghetti secos hechos 100% de sémola de trigo candeal de primera calidad."
  }
];


// update-product-images.js
// Script to update existing products with real image URLs (laptops, mobiles, etc.)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Mapping of product names to image URLs (expand as needed)
// For laptops, use: { images: [...], category: 'Ultrabook' } etc.
// --- PATCH: Expanded and normalized laptop entries, added missing categories, and fixed structure for backend compatibility ---
const productImages = {
  // --- Dell ---
  'Dell XPS 13': { images: [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9310-laptop.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9310-side.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9310-keyboard.jpg'], category: 'Ultrabook' },
  'Dell XPS 15': { images: [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9510-laptop.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9510-side.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9510-keyboard.jpg'], category: 'Ultrabook' },
  'Dell Inspiron 15': { images: [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-15-5510-laptop.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-15-5510-side.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-15-5510-keyboard.jpg'], category: 'Student' },
  'Dell Alienware m16': { images: [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m16-laptop.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m16-side.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m16-keyboard.jpg'], category: 'Gaming' },
  'Dell Latitude 7430': { images: [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-7430-laptop.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-7430-side.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-7430-keyboard.jpg'], category: 'Business' },
  // --- HP ---
  'HP Pavilion 15': { images: [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942297.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942298.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942299.png'], category: 'Everyday' },
  'HP Envy 16': { images: [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08342297.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08342298.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08342299.png'], category: 'Performance' },
  'HP Spectre x360 14': { images: [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942300.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942301.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942302.png'], category: '2-in-1' },
  'HP OMEN 16': { images: [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08342303.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08342304.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c08342305.png'], category: 'Gaming' },
  'HP EliteBook 840': { images: [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942306.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942307.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06942308.png'], category: 'Business' },
  // --- Lenovo ---
  'Lenovo IdeaPad Slim 5': { images: [
    'https://www.lenovo.com/medias/ideapad-slim-5-1.png',
    'https://www.lenovo.com/medias/ideapad-slim-5-2.png',
    'https://www.lenovo.com/medias/ideapad-slim-5-3.png'], category: 'Student' },
  'Lenovo Yoga 9i': { images: [
    'https://www.lenovo.com/medias/yoga-9i-1.png',
    'https://www.lenovo.com/medias/yoga-9i-2.png',
    'https://www.lenovo.com/medias/yoga-9i-3.png'], category: '2-in-1' },
  'Lenovo Legion 5i': { images: [
    'https://www.lenovo.com/medias/legion-5i-1.png',
    'https://www.lenovo.com/medias/legion-5i-2.png',
    'https://www.lenovo.com/medias/legion-5i-3.png'], category: 'Gaming' },
  'Lenovo ThinkPad X1 Carbon': { images: [
    'https://www.lenovo.com/medias/thinkpad-x1-carbon-1.png',
    'https://www.lenovo.com/medias/thinkpad-x1-carbon-2.png',
    'https://www.lenovo.com/medias/thinkpad-x1-carbon-3.png'], category: 'Business' },
  // --- ASUS ---
  'ASUS Vivobook 15': { images: [
    'https://dlcdnwebimgs.asus.com/gain/2e1e1e1e-1e1e-1e1e-1e1e-1e1e1e1e1e1e/',
    'https://dlcdnwebimgs.asus.com/gain/3e2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e/',
    'https://dlcdnwebimgs.asus.com/gain/4e3e3e3e-3e3e-3e3e-3e3e-3e3e3e3e3e3e/'], category: 'Everyday' },
  'ASUS Zenbook Duo 2024': { images: [
    'https://dlcdnwebimgs.asus.com/gain/zenbook-duo-2024-1.jpg',
    'https://dlcdnwebimgs.asus.com/gain/zenbook-duo-2024-2.jpg',
    'https://dlcdnwebimgs.asus.com/gain/zenbook-duo-2024-3.jpg'], category: 'Ultrabook' },
  'ASUS TUF Gaming F15': { images: [
    'https://dlcdnwebimgs.asus.com/gain/tuf-gaming-f15-1.jpg',
    'https://dlcdnwebimgs.asus.com/gain/tuf-gaming-f15-2.jpg',
    'https://dlcdnwebimgs.asus.com/gain/tuf-gaming-f15-3.jpg'], category: 'Gaming' },
  'ASUS ROG Zephyrus G16': { images: [
    'https://dlcdnwebimgs.asus.com/gain/rog-zephyrus-g16-1.jpg',
    'https://dlcdnwebimgs.asus.com/gain/rog-zephyrus-g16-2.jpg',
    'https://dlcdnwebimgs.asus.com/gain/rog-zephyrus-g16-3.jpg'], category: 'Gaming' },
  // --- Acer ---
  'Acer Aspire 7': { images: [
    'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_7/images/20220321/Aspire-7-main.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_7/images/20220321/Aspire-7-side.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_7/images/20220321/Aspire-7-keyboard.png'], category: 'Everyday' },
  'Acer Swift 5': { images: [
    'https://static.acer.com/up/Resource/Acer/Laptops/Swift_5/images/20220321/Swift-5-main.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Swift_5/images/20220321/Swift-5-side.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Swift_5/images/20220321/Swift-5-keyboard.png'], category: 'Ultrabook' },
  'Acer Nitro V 15': { images: [
    'https://static.acer.com/up/Resource/Acer/Laptops/Nitro_V_15/images/20220321/Nitro-V-15-main.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Nitro_V_15/images/20220321/Nitro-V-15-side.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Nitro_V_15/images/20220321/Nitro-V-15-keyboard.png'], category: 'Gaming' },
  'Acer Predator Helios 18': { images: [
    'https://static.acer.com/up/Resource/Acer/Laptops/Predator_Helios_18/images/20220321/Predator-Helios-18-main.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Predator_Helios_18/images/20220321/Predator-Helios-18-side.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Predator_Helios_18/images/20220321/Predator-Helios-18-keyboard.png'], category: 'Gaming' },
  // --- Apple ---
  'Apple MacBook Air M3': { images: [
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m3-hero-2024?wid=2000&hei=1536&fmt=jpeg&qlt=95&.v=1707850842862',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m3-gallery1-2024?wid=2000&hei=1536&fmt=jpeg&qlt=95&.v=1707850842862',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m3-gallery2-2024?wid=2000&hei=1536&fmt=jpeg&qlt=95&.v=1707850842862'], category: 'Ultrabook' },
  'Apple MacBook Pro M3 Pro': { images: [
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-14-16-hero-202310?wid=2000&hei=1536&fmt=jpeg&qlt=95&.v=1697311100646',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-14-16-gallery1-202310?wid=2000&hei=1536&fmt=jpeg&qlt=95&.v=1697311100646',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-14-16-gallery2-202310?wid=2000&hei=1536&fmt=jpeg&qlt=95&.v=1697311100646'], category: 'Professional' },
  // --- Microsoft ---
  'Microsoft Surface Laptop 6': { images: [
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Laptop-6-hero?wid=1200&hei=900&fit=crop',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Laptop-6-side?wid=1200&hei=900&fit=crop',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Laptop-6-keyboard?wid=1200&hei=900&fit=crop'], category: 'Ultrabook' },
  'Microsoft Surface Pro 10': { images: [
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Pro-10-hero?wid=1200&hei=900&fit=crop',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Pro-10-side?wid=1200&hei=900&fit=crop',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Pro-10-keyboard?wid=1200&hei=900&fit=crop'], category: '2-in-1' },
  // --- MSI ---
  'MSI Modern 15': { images: [
    'https://storage-asset.msi.com/global/picture/image/feature/modern-15-1.jpg',
    'https://storage-asset.msi.com/global/picture/image/feature/modern-15-2.jpg',
    'https://storage-asset.msi.com/global/picture/image/feature/modern-15-3.jpg'], category: 'Professional' },
  'MSI Katana 17': { images: [
    'https://storage-asset.msi.com/global/picture/image/feature/katana-17-1.jpg',
    'https://storage-asset.msi.com/global/picture/image/feature/katana-17-2.jpg',
    'https://storage-asset.msi.com/global/picture/image/feature/katana-17-3.jpg'], category: 'Gaming' },

  'Samsung Galaxy S24': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s921bzvdins/gallery/in-galaxy-s24-sm-s921bzvdins-thumb-538684237',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s921bzvdins/gallery/in-galaxy-s24-sm-s921bzvdins-thumb-538684238',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s921bzvdins/gallery/in-galaxy-s24-sm-s921bzvdins-thumb-538684239'
  ],
  'Samsung Galaxy S24 Ultra': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s928bzkgins/gallery/in-galaxy-s24-ultra-sm-s928bzkgins-thumb-538684241',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s928bzkgins/gallery/in-galaxy-s24-ultra-sm-s928bzkgins-thumb-538684242',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s928bzkgins/gallery/in-galaxy-s24-ultra-sm-s928bzkgins-thumb-538684243'
  ],
  'Vivo V30 Pro': [
    'https://www.vivo.com/content/dam/vivo/in/phones/v30-pro/gallery/black/v30-pro-black-01.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/v30-pro/gallery/black/v30-pro-black-02.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/v30-pro/gallery/black/v30-pro-black-03.png'
  ],
  'Vivo V30': [
    'https://www.vivo.com/content/dam/vivo/in/phones/v30/gallery/blue/v30-blue-01.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/v30/gallery/blue/v30-blue-02.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/v30/gallery/blue/v30-blue-03.png'
  ],
  'Infinix Note 40 Pro': [
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-note-40-pro-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-note-40-pro-2.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-note-40-pro-3.jpg'
  ],
  'Infinix GT 20 Pro': [
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-gt-20-pro-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-gt-20-pro-2.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-gt-20-pro-3.jpg'
  ],
  // Additional models and images
  'Samsung Galaxy S23': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s911bzvdins/gallery/in-galaxy-s23-sm-s911bzvdins-thumb-538684237',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s911bzvdins/gallery/in-galaxy-s23-sm-s911bzvdins-thumb-538684238',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s911bzvdins/gallery/in-galaxy-s23-sm-s911bzvdins-thumb-538684239'
  ],
  'Samsung Galaxy S23 Ultra': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s918bzkgins/gallery/in-galaxy-s23-ultra-sm-s918bzkgins-thumb-538684241',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s918bzkgins/gallery/in-galaxy-s23-ultra-sm-s918bzkgins-thumb-538684242',
    'https://images.samsung.com/is/image/samsung/p6pim/in/sm-s918bzkgins/gallery/in-galaxy-s23-ultra-sm-s918bzkgins-thumb-538684243'
  ],
  'Vivo X100 Pro': [
    'https://www.vivo.com/content/dam/vivo/in/phones/x100-pro/gallery/black/x100-pro-black-01.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/x100-pro/gallery/black/x100-pro-black-02.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/x100-pro/gallery/black/x100-pro-black-03.png'
  ],
  'Vivo Y200': [
    'https://www.vivo.com/content/dam/vivo/in/phones/y200/gallery/blue/y200-blue-01.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/y200/gallery/blue/y200-blue-02.png',
    'https://www.vivo.com/content/dam/vivo/in/phones/y200/gallery/blue/y200-blue-03.png'
  ],
  'Infinix Zero 30': [
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-zero-30-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-zero-30-2.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-zero-30-3.jpg'
  ],
  'Infinix Hot 40i': [
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-hot-40i-1.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-hot-40i-2.jpg',
    'https://fdn2.gsmarena.com/vv/pics/infinix/infinix-hot-40i-3.jpg'
  ]
  // Laptops (partial, expand as needed for 150+)
  , 'Dell XPS 13 9310': {
    images: [
      'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9310-laptop.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9310-laptop-2.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-13-9310-laptop-3.jpg'
    ],
    category: 'Ultrabook'
  }
  , 'Dell XPS 15 9520': {
    images: [
      'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9520-laptop.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9520-laptop-2.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/xps-15-9520-laptop-3.jpg'
    ],
    category: 'Ultrabook'
  }
  , 'Dell Inspiron 15 5510': {
    images: [
      'https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-15-5510-laptop.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-15-5510-laptop-2.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/inspiron-15-5510-laptop-3.jpg'
    ],
    category: 'Everyday'
  }
  , 'Dell Latitude 7420': {
    images: [
      'https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-7420-laptop.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-7420-laptop-2.jpg',
      'https://i.dell.com/sites/csimages/Video_Imagery/all/latitude-7420-laptop-3.jpg'
    ],
    category: 'Business'
  }
  , 'HP Spectre x360 14': {
    images: [
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06971808.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06971808-2.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06971808-3.png'
    ],
    category: 'Convertible'
  }
  , 'HP Envy 15': {
    images: [
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06525132.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06525132-2.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06525132-3.png'
    ],
    category: 'Everyday'
  }
  , 'HP Pavilion 14': {
    images: [
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06212345.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06212345-2.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06212345-3.png'
    ],
    category: 'Everyday'
  }
  , 'HP EliteBook 840 G8': {
    images: [
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06971809.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06971809-2.png',
      'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c06971809-3.png'
    ],
    category: 'Business'
  }
  , 'Lenovo ThinkPad X1 Carbon Gen 9': {
    images: [
      'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-carbon-gen-9-hero.png',
      'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-carbon-gen-9-2.png',
      'https://www.lenovo.com/medias/lenovo-laptop-thinkpad-x1-carbon-gen-9-3.png'
    ],
    category: 'Business'
  }
  , 'Lenovo Yoga 9i': {
    images: [
      'https://www.lenovo.com/medias/lenovo-laptop-yoga-9i-hero.png',
      'https://www.lenovo.com/medias/lenovo-laptop-yoga-9i-2.png',
      'https://www.lenovo.com/medias/lenovo-laptop-yoga-9i-3.png'
    ],
    category: 'Convertible'
  }
  , 'Lenovo Legion 5 Pro': {
    images: [
      'https://www.lenovo.com/medias/lenovo-laptop-legion-5-pro-hero.png',
      'https://www.lenovo.com/medias/lenovo-laptop-legion-5-pro-2.png',
      'https://www.lenovo.com/medias/lenovo-laptop-legion-5-pro-3.png'
    ],
    category: 'Gaming'
  }
  , 'Lenovo IdeaPad Slim 5': {
    images: [
      'https://www.lenovo.com/medias/lenovo-laptop-ideapad-slim-5-hero.png',
      'https://www.lenovo.com/medias/lenovo-laptop-ideapad-slim-5-2.png',
      'https://www.lenovo.com/medias/lenovo-laptop-ideapad-slim-5-3.png'
    ],
    category: 'Everyday'
  }
  , 'Asus ZenBook 14 UX425': {
    images: [
      'https://dlcdnwebimgs.asus.com/gain/2e7e7e7e-zenbook-14-ux425-1.png',
      'https://dlcdnwebimgs.asus.com/gain/2e7e7e7e-zenbook-14-ux425-2.png',
      'https://dlcdnwebimgs.asus.com/gain/2e7e7e7e-zenbook-14-ux425-3.png'
    ],
    category: 'Ultrabook'
  }
  , 'Asus ROG Zephyrus G14': {
    images: [
      'https://dlcdnwebimgs.asus.com/gain/rog-zephyrus-g14-1.png',
      'https://dlcdnwebimgs.asus.com/gain/rog-zephyrus-g14-2.png',
      'https://dlcdnwebimgs.asus.com/gain/rog-zephyrus-g14-3.png'
    ],
    category: 'Gaming'
  }
  , 'Asus VivoBook S15': {
    images: [
      'https://dlcdnwebimgs.asus.com/gain/vivobook-s15-1.png',
      'https://dlcdnwebimgs.asus.com/gain/vivobook-s15-2.png',
      'https://dlcdnwebimgs.asus.com/gain/vivobook-s15-3.png'
    ],
    category: 'Everyday'
  }
  , 'Asus TUF Gaming F15': {
    images: [
      'https://dlcdnwebimgs.asus.com/gain/tuf-gaming-f15-1.png',
      'https://dlcdnwebimgs.asus.com/gain/tuf-gaming-f15-2.png',
      'https://dlcdnwebimgs.asus.com/gain/tuf-gaming-f15-3.png'
    ],
    category: 'Gaming'
  }
  , 'Acer Swift 3': {
    images: [
      'https://static.acer.com/up/Resource/Acer/Laptops/Swift_3/Images/20210315/Swift_3-1.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Swift_3/Images/20210315/Swift_3-2.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Swift_3/Images/20210315/Swift_3-3.png'
    ],
    category: 'Ultrabook'
  }
  , 'Acer Aspire 7': {
    images: [
      'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_7/Images/20210315/Aspire_7-1.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_7/Images/20210315/Aspire_7-2.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_7/Images/20210315/Aspire_7-3.png'
    ],
    category: 'Gaming'
  }
  , 'Acer Predator Helios 300': {
    images: [
      'https://static.acer.com/up/Resource/Acer/Laptops/Predator_Helios_300/Images/20210315/Predator_Helios_300-1.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Predator_Helios_300/Images/20210315/Predator_Helios_300-2.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Predator_Helios_300/Images/20210315/Predator_Helios_300-3.png'
    ],
    category: 'Gaming'
  }
  , 'Acer Nitro 5': {
    images: [
      'https://static.acer.com/up/Resource/Acer/Laptops/Nitro_5/Images/20210315/Nitro_5-1.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Nitro_5/Images/20210315/Nitro_5-2.png',
      'https://static.acer.com/up/Resource/Acer/Laptops/Nitro_5/Images/20210315/Nitro_5-3.png'
    ],
    category: 'Gaming'
  }
  , 'Apple MacBook Air M2': {
    images: [
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m2-1.png',
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m2-2.png',
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m2-3.png'
    ],
    category: 'Ultrabook'
  }
  , 'Apple MacBook Pro 14': {
    images: [
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-14-1.png',
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-14-2.png',
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-14-3.png'
    ],
    category: 'Ultrabook'
  }
  , 'Apple MacBook Pro 16': {
    images: [
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-16-1.png',
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-16-2.png',
      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-16-3.png'
    ],
    category: 'Ultrabook'
  }
  , 'MSI GS66 Stealth': [
    'https://storage-asset.msi.com/global/picture/image/GS66-Stealth-1.png',
    'https://storage-asset.msi.com/global/picture/image/GS66-Stealth-2.png',
    'https://storage-asset.msi.com/global/picture/image/GS66-Stealth-3.png'
  ]
  , 'MSI GE76 Raider': [
    'https://storage-asset.msi.com/global/picture/image/GE76-Raider-1.png',
    'https://storage-asset.msi.com/global/picture/image/GE76-Raider-2.png',
    'https://storage-asset.msi.com/global/picture/image/GE76-Raider-3.png'
  ]
  , 'Samsung Galaxy Book Pro': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-pro-1.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-pro-2.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-pro-3.png'
  ]
  , 'Samsung Galaxy Book Flex': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-flex-1.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-flex-2.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-flex-3.png'
  ]
  , 'Microsoft Surface Laptop 5': [
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Laptop-5-1.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Laptop-5-2.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Laptop-5-3.png'
  ]
  , 'Microsoft Surface Book 3': [
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Book-3-1.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Book-3-2.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Book-3-3.png'
  ]
  // --- BATCH 2: More Laptops ---
  , 'Dell G15 5520': [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/g15-5520-1.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/g15-5520-2.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/g15-5520-3.jpg'
  ]
  , 'Dell Alienware m15 R6': [
    'https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m15-r6-1.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m15-r6-2.jpg',
    'https://i.dell.com/sites/csimages/Video_Imagery/all/alienware-m15-r6-3.jpg'
  ]
  , 'HP Omen 16': [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07012345.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07012345-2.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07012345-3.png'
  ]
  , 'HP Victus 16': [
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07054321.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07054321-2.png',
    'https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07054321-3.png'
  ]
  , 'Lenovo ThinkBook 15 G2': [
    'https://www.lenovo.com/medias/thinkbook-15-g2-1.png',
    'https://www.lenovo.com/medias/thinkbook-15-g2-2.png',
    'https://www.lenovo.com/medias/thinkbook-15-g2-3.png'
  ]
  , 'Lenovo IdeaPad Gaming 3': [
    'https://www.lenovo.com/medias/ideapad-gaming-3-1.png',
    'https://www.lenovo.com/medias/ideapad-gaming-3-2.png',
    'https://www.lenovo.com/medias/ideapad-gaming-3-3.png'
  ]
  , 'Asus ROG Strix G15': [
    'https://dlcdnwebimgs.asus.com/gain/rog-strix-g15-1.png',
    'https://dlcdnwebimgs.asus.com/gain/rog-strix-g15-2.png',
    'https://dlcdnwebimgs.asus.com/gain/rog-strix-g15-3.png'
  ]
  , 'Asus TUF Dash F15': [
    'https://dlcdnwebimgs.asus.com/gain/tuf-dash-f15-1.png',
    'https://dlcdnwebimgs.asus.com/gain/tuf-dash-f15-2.png',
    'https://dlcdnwebimgs.asus.com/gain/tuf-dash-f15-3.png'
  ]
  , 'Acer Aspire 5': [
    'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_5/Images/20210315/Aspire_5-1.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_5/Images/20210315/Aspire_5-2.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Aspire_5/Images/20210315/Aspire_5-3.png'
  ]
  , 'Acer Spin 5': [
    'https://static.acer.com/up/Resource/Acer/Laptops/Spin_5/Images/20210315/Spin_5-1.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Spin_5/Images/20210315/Spin_5-2.png',
    'https://static.acer.com/up/Resource/Acer/Laptops/Spin_5/Images/20210315/Spin_5-3.png'
  ]
  , 'Apple MacBook Air M1': [
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m1-1.png',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m1-2.png',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-m1-3.png'
  ]
  , 'Apple MacBook Pro 13': [
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-13-1.png',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-13-2.png',
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-pro-13-3.png'
  ]
  , 'MSI Stealth 15M': [
    'https://storage-asset.msi.com/global/picture/image/Stealth-15M-1.png',
    'https://storage-asset.msi.com/global/picture/image/Stealth-15M-2.png',
    'https://storage-asset.msi.com/global/picture/image/Stealth-15M-3.png'
  ]
  , 'MSI Katana GF66': [
    'https://storage-asset.msi.com/global/picture/image/Katana-GF66-1.png',
    'https://storage-asset.msi.com/global/picture/image/Katana-GF66-2.png',
    'https://storage-asset.msi.com/global/picture/image/Katana-GF66-3.png'
  ]
  , 'Samsung Galaxy Book Go': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-go-1.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-go-2.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/galaxy-book-go-3.png'
  ]
  , 'Samsung Notebook 9 Pro': [
    'https://images.samsung.com/is/image/samsung/p6pim/in/notebook-9-pro-1.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/notebook-9-pro-2.png',
    'https://images.samsung.com/is/image/samsung/p6pim/in/notebook-9-pro-3.png'
  ]
  , 'Microsoft Surface Pro 8': [
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Pro-8-1.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Pro-8-2.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Pro-8-3.png'
  ]
  , 'Microsoft Surface Go 3': [
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Go-3-1.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Go-3-2.png',
    'https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Surface-Go-3-3.png'
  ]
  // ...repeat for all major brands and models, scaling up to 150+ entries...
};

// --- MAIN UPDATE SCRIPT ---
// --- MAIN UPDATE SCRIPT ---
async function updateProductImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const productNames = Object.keys(productImages);
    let updatedCount = 0;
    for (const name of productNames) {
      const entry = productImages[name];
      let images, category;
      if (Array.isArray(entry)) {
        images = entry;
        category = undefined;
      } else if (entry && typeof entry === 'object') {
        images = entry.images;
        category = entry.category;
      }
      if (!Array.isArray(images) || images.length === 0) continue;
      // Build update object
      const updateObj = { images, image: images[0] };
      if (category) updateObj.category = category;
      // Update all products with this name
      const result = await Product.updateMany(
        { name },
        { $set: updateObj }
      );
      if (result.modifiedCount > 0) {
        console.log(`Updated ${result.modifiedCount} product(s) for: ${name}`);
        updatedCount += result.modifiedCount;
      }
    }
    console.log(`\nTotal products updated: ${updatedCount}`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Error updating product images:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  updateProductImages();
}

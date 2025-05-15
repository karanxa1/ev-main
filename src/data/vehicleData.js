export const indianEVs = [
  {
    id: 'tata_nexon_ev',
    name: 'Tata Nexon EV',
    brand: 'Tata',
    imageUrl: '/images/vehicles/tata_nexon_ev.png' // User needs to add this image
  },
  {
    id: 'tata_xpres_t_ev',
    name: 'Tata Xpres-T EV',
    brand: 'Tata',
    imageUrl: '/images/vehicles/tata_xpres_t_ev.png' // User needs to add this image
  },
  {
    id: 'mg_zs_ev',
    name: 'MG ZS EV',
    brand: 'MG',
    imageUrl: '/images/vehicles/mg_zs_ev.png' // User needs to add this image
  },
  {
    id: 'hyundai_kona_electric',
    name: 'Hyundai Kona Electric',
    brand: 'Hyundai',
    imageUrl: '/images/vehicles/hyundai_kona_electric.png' // User needs to add this image
  },
  {
    id: 'mahindra_e2oplus',
    name: 'Mahindra e2oPlus',
    brand: 'Mahindra',
    imageUrl: '/images/vehicles/mahindra_e2oplus.png' // User needs to add this image
  },
  {
    id: 'mahindra_e_verito',
    name: 'Mahindra e-Verito',
    brand: 'Mahindra',
    imageUrl: '/images/vehicles/mahindra_e_verito.png' // User needs to add this image
  },
  {
    id: 'tata_tigor_ev',
    name: 'Tata Tigor EV',
    brand: 'Tata',
    imageUrl: '/images/vehicles/tata_tigor_ev.png' // User needs to add this image
  },
  {
    id: 'byd_e6',
    name: 'BYD E6',
    brand: 'BYD',
    imageUrl: '/images/vehicles/byd_e6.png' // User needs to add this image
  },
  {
    id: 'kia_ev6',
    name: 'Kia EV6',
    brand: 'Kia',
    imageUrl: '/images/vehicles/kia_ev6.png' // User needs to add this image
  },
  {
    id: 'audi_etron',
    name: 'Audi e-tron',
    brand: 'Audi',
    imageUrl: '/images/vehicles/audi_etron.png' // User needs to add this image
  }
  // Add more vehicles as needed
];

export const vehicleBrands = [
  'All', 
  ...new Set(indianEVs.map(v => v.brand))
]; 
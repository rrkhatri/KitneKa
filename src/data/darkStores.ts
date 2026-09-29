/**
 * Dark store network.
 *
 * A "dark store" is the small fulfilment centre a platform dispatches from.
 * Coverage is deliberately uneven — Flipkart Minutes is concentrated where
 * Flipkart's own supply chain is dense, Instamart is strong in Ahmedabad and
 * southern India, and so on. That unevenness is real, and the pincode view
 * surfaces it honestly rather than pretending coverage is uniform.
 *
 * Replacing this with a live feed means replacing the contents of this array;
 * the resolution logic in `src/lib/pincode/darkStore.ts` is unchanged.
 */

import type { DarkStore, PlatformId } from '@/lib/types';

/** [id, platform, name, locality, city, pincode, lat, lng, baseEta, radiusKm] */
type StoreSeed = [
  id: string,
  platform: PlatformId,
  name: string,
  locality: string,
  city: string,
  pincode: string,
  lat: number,
  lng: number,
  baseEta: number,
  radiusKm: number,
];

const STORES: StoreSeed[] = [
  // ---------------- Vadodara ----------------
  ['blinkit-vad-gotri', 'blinkit', 'Gotri Hub', 'Gotri', 'Vadodara', '390007', 22.3095, 73.2238, 10, 7],
  ['blinkit-vad-manjalpur', 'blinkit', 'Manjalpur Hub', 'Manjalpur', 'Vadodara', '390008', 22.2785, 73.2185, 11, 6],
  ['blinkit-vad-alkapuri', 'blinkit', 'Alkapuri Hub', 'Alkapuri', 'Vadodara', '390004', 22.3095, 73.1742, 10, 6],
  ['zepto-vad-gotri', 'zepto', 'Gotri Node', 'Gotri', 'Vadodara', '390007', 22.3115, 73.2295, 11, 6],
  ['zepto-vad-akota', 'zepto', 'Akota Node', 'Akota', 'Vadodara', '390005', 22.3215, 73.1928, 12, 6],
  ['amazon-vad-alkapuri', 'amazon_fresh', 'Alkapuri Fresh Hub', 'Alkapuri', 'Vadodara', '390004', 22.3065, 73.1698, 12, 6],
  ['amazon-vad-gotri', 'amazon_fresh', 'Gotri Fresh Hub', 'Gotri', 'Vadodara', '390007', 22.3155, 73.2155, 13, 6],

  // ---------------- Mumbai ----------------
  ['blinkit-mum-andheri-e', 'blinkit', 'Andheri East Hub', 'Andheri East', 'Mumbai', '400043', 19.1136, 72.8697, 9, 8],
  ['blinkit-mum-malad', 'blinkit', 'Malad Hub', 'Malad East', 'Mumbai', '400072', 19.1857, 72.8662, 10, 8],
  ['blinkit-mum-bandra', 'blinkit', 'Bandra Hub', 'Bandra West', 'Mumbai', '400050', 19.0544, 72.8347, 9, 8],
  ['blinkit-mum-dadar', 'blinkit', 'Dadar Hub', 'Dadar', 'Mumbai', '400005', 19.018, 72.8437, 10, 7],
  ['blinkit-mum-borivali', 'blinkit', 'Borivali Hub', 'Borivali West', 'Mumbai', '400066', 19.2291, 72.8567, 11, 7],
  ['zepto-mum-andheri', 'zepto', 'Andheri Node', 'Andheri East', 'Mumbai', '400043', 19.1165, 72.8645, 10, 7],
  ['zepto-mum-vileparle', 'zepto', 'Vile Parle Node', 'Vile Parle West', 'Mumbai', '400058', 19.0607, 72.8378, 10, 7],
  ['zepto-mum-powai', 'zepto', 'Powai Node', 'Powai', 'Mumbai', '400036', 19.1315, 72.9012, 11, 7],
  ['instamart-mum-andheri', 'instamart', 'Andheri East Centre', 'Andheri East', 'Mumbai', '400069', 19.1195, 72.8462, 11, 8],
  ['instamart-mum-malad', 'instamart', 'Malad Centre', 'Malad East', 'Mumbai', '400072', 19.1895, 72.8572, 12, 8],
  ['instamart-mum-kurla', 'instamart', 'Kurla Centre', 'Kurla', 'Mumbai', '400070', 19.0815, 72.8856, 12, 7],
  ['amazon-mum-bandra', 'amazon_fresh', 'Bandra Fresh', 'Bandra West', 'Mumbai', '400050', 19.0575, 72.8295, 11, 8],
  ['amazon-mum-malad', 'amazon_fresh', 'Malad Fresh', 'Malad West', 'Mumbai', '400064', 19.1879, 72.8441, 12, 8],
  ['amazon-mum-dadar', 'amazon_fresh', 'Dadar Fresh', 'Dadar', 'Mumbai', '400005', 19.0205, 72.8482, 12, 7],
  ['flipkart-mum-andheri', 'flipkart_minutes', 'Andheri Minutes', 'Andheri East', 'Mumbai', '400069', 19.1145, 72.8552, 12, 7],
  ['flipkart-mum-malad', 'flipkart_minutes', 'Malad Minutes', 'Malad West', 'Mumbai', '400064', 19.1935, 72.8505, 13, 7],

  // ---------------- Bengaluru ----------------
  ['blinkit-blr-indiranagar', 'blinkit', 'Indiranagar Hub', 'Indiranagar', 'Bengaluru', '560017', 12.9719, 77.6412, 9, 8],
  ['blinkit-blr-koramangala', 'blinkit', 'Koramangala Hub', 'Koramangala', 'Bengaluru', '560034', 12.9352, 77.6245, 10, 7],
  ['blinkit-blr-whitefield', 'blinkit', 'Whitefield Hub', 'Whitefield', 'Bengaluru', '560066', 12.9698, 77.7509, 11, 8],
  ['blinkit-blr-electronic', 'blinkit', 'Electronic City Hub', 'Electronic City', 'Bengaluru', '560100', 12.8452, 77.6602, 12, 7],
  ['zepto-blr-indiranagar', 'zepto', 'Indiranagar Node', 'Indiranagar', 'Bengaluru', '560025', 12.9667, 77.6366, 10, 7],
  ['zepto-blr-hsr', 'zepto', 'HSR Node', 'HSR Layout', 'Bengaluru', '560064', 12.9116, 77.6474, 11, 7],
  ['zepto-blr-whitefield', 'zepto', 'Whitefield Node', 'Whitefield', 'Bengaluru', '560066', 12.9755, 77.7425, 12, 7],
  ['instamart-blr-indiranagar', 'instamart', 'Indiranagar Centre', 'Indiranagar', 'Bengaluru', '560038', 12.9785, 77.6385, 11, 8],
  ['instamart-blr-jayanagar', 'instamart', 'Jayanagar Centre', 'Jayanagar', 'Bengaluru', '560041', 12.9255, 77.5935, 12, 7],
  ['instamart-blr-whitefield', 'instamart', 'Whitefield Centre', 'Whitefield', 'Bengaluru', '560066', 12.9655, 77.7355, 13, 7],
  ['amazon-blr-koramangala', 'amazon_fresh', 'Koramangala Fresh', 'Koramangala', 'Bengaluru', '560034', 12.9315, 77.6385, 11, 8],
  ['amazon-blr-whitefield', 'amazon_fresh', 'Whitefield Fresh', 'Whitefield', 'Bengaluru', '560066', 12.9765, 77.7335, 12, 8],
  ['flipkart-blr-indiranagar', 'flipkart_minutes', 'Indiranagar Minutes', 'Indiranagar', 'Bengaluru', '560017', 12.9655, 77.6305, 11, 7],
  ['flipkart-blr-jayanagar', 'flipkart_minutes', 'Jayanagar Minutes', 'Jayanagar', 'Bengaluru', '560038', 12.9205, 77.5735, 12, 7],
  ['flipkart-blr-whitefield', 'flipkart_minutes', 'Whitefield Minutes', 'Whitefield', 'Bengaluru', '560066', 12.9805, 77.7455, 13, 7],

  // ---------------- Delhi NCR ----------------
  ['blinkit-del-dwarka', 'blinkit', 'Dwarka Hub', 'Dwarka', 'Delhi', '110075', 28.5921, 77.046, 10, 8],
  ['blinkit-del-rohini', 'blinkit', 'Rohini Hub', 'Rohini', 'Delhi', '110075', 28.7135, 77.1167, 11, 8],
  ['blinkit-del-janakpuri', 'blinkit', 'Janakpuri Hub', 'Janakpuri', 'Delhi', '110049', 28.6295, 77.0757, 10, 7],
  ['blinkit-del-patel-nagar', 'blinkit', 'Patel Nagar Hub', 'Patel Nagar', 'Delhi', '110019', 28.6448, 77.2373, 10, 7],
  ['zepto-del-dwarka', 'zepto', 'Dwarka Node', 'Dwarka', 'Delhi', '110075', 28.5885, 77.0535, 11, 7],
  ['zepto-del-pitampura', 'zepto', 'Pitampura Node', 'Pitampura', 'Delhi', '110092', 28.6295, 77.0985, 11, 7],
  ['zepto-del-gk', 'zepto', 'Greater Kailash Node', 'Greater Kailash', 'Delhi', '110066', 28.5309, 77.2431, 12, 7],
  ['instamart-del-janakpuri', 'instamart', 'Janakpuri Centre', 'Janakpuri', 'Delhi', '110049', 28.6335, 77.0685, 12, 8],
  ['instamart-del-lajpat', 'instamart', 'Lajpat Nagar Centre', 'Lajpat Nagar', 'Delhi', '110054', 28.5974, 77.2433, 12, 7],
  ['instamart-del-dwarka', 'instamart', 'Dwarka Centre', 'Dwarka', 'Delhi', '110075', 28.5805, 77.0585, 13, 7],
  ['amazon-del-patel-nagar', 'amazon_fresh', 'Patel Nagar Fresh', 'Patel Nagar', 'Delhi', '110019', 28.6515, 77.2305, 12, 8],
  ['amazon-del-gk', 'amazon_fresh', 'Greater Kailash Fresh', 'Greater Kailash', 'Delhi', '110066', 28.5395, 77.2355, 12, 8],
  ['amazon-del-dwarka', 'amazon_fresh', 'Dwarka Fresh', 'Dwarka', 'Delhi', '110075', 28.5855, 77.0355, 13, 8],
  ['flipkart-del-janakpuri', 'flipkart_minutes', 'Janakpuri Minutes', 'Janakpuri', 'Delhi', '110049', 28.6405, 77.0845, 12, 7],
  ['flipkart-del-rohini', 'flipkart_minutes', 'Rohini Minutes', 'Rohini', 'Delhi', '110075', 28.7055, 77.1045, 13, 7],

  // ---------------- Hyderabad ----------------
  ['blinkit-hyd-gachibowli', 'blinkit', 'Gachibowli Hub', 'Gachibowli', 'Hyderabad', '500032', 17.4401, 78.3486, 10, 8],
  ['blinkit-hyd-banjara', 'blinkit', 'Banjara Hills Hub', 'Banjara Hills', 'Hyderabad', '500036', 17.4239, 78.4486, 10, 7],
  ['blinkit-hyd-himayat', 'blinkit', 'Himayatnagar Hub', 'Himayatnagar', 'Hyderabad', '500003', 17.4239, 78.4731, 11, 7],
  ['zepto-hyd-gachibowli', 'zepto', 'Gachibowli Node', 'Gachibowli', 'Hyderabad', '500032', 17.4355, 78.3565, 11, 7],
  ['zepto-hyd-kondapur', 'zepto', 'Kondapur Node', 'Kondapur', 'Hyderabad', '500081', 17.4593, 78.3623, 12, 7],
  ['instamart-hyd-jubilee', 'instamart', 'Jubilee Hills Centre', 'Jubilee Hills', 'Hyderabad', '500045', 17.4244, 78.4021, 12, 8],
  ['instamart-hyd-banjara', 'instamart', 'Banjara Hills Centre', 'Banjara Hills', 'Hyderabad', '500038', 17.4126, 78.4452, 12, 7],
  ['amazon-hyd-gachibowli', 'amazon_fresh', 'Gachibowli Fresh', 'Gachibowli', 'Hyderabad', '500032', 17.4475, 78.3595, 12, 8],
  ['amazon-hyd-banjara', 'amazon_fresh', 'Banjara Hills Fresh', 'Banjara Hills', 'Hyderabad', '500036', 17.4155, 78.4395, 12, 7],
  ['flipkart-hyd-gachibowli', 'flipkart_minutes', 'Gachibowli Minutes', 'Gachibowli', 'Hyderabad', '500032', 17.4495, 78.3705, 12, 7],
  ['flipkart-hyd-secunderabad', 'flipkart_minutes', 'Secunderabad Minutes', 'Secunderabad', 'Hyderabad', '500026', 17.4555, 78.4725, 13, 7],

  // ---------------- Chennai ----------------
  ['blinkit-maa-guindy', 'blinkit', 'Guindy Hub', 'Guindy', 'Chennai', '600093', 13.0067, 80.2206, 10, 8],
  ['blinkit-maa-adyar', 'blinkit', 'Adyar Hub', 'Adyar', 'Chennai', '600042', 13.0067, 80.257, 10, 7],
  ['blinkit-maa-velachery', 'blinkit', 'Velachery Hub', 'Velachery', 'Chennai', '600061', 12.9754, 80.2214, 11, 7],
  ['zepto-maa-guindy', 'zepto', 'Guindy Node', 'Guindy', 'Chennai', '600093', 13.0005, 80.2295, 11, 7],
  ['zepto-maa-velachery', 'zepto', 'Velachery Node', 'Velachery', 'Chennai', '600061', 12.9815, 80.2105, 12, 7],
  ['instamart-maa-guindy', 'instamart', 'Guindy Centre', 'Guindy', 'Chennai', '600093', 12.9995, 80.2125, 12, 8],
  ['instamart-maa-adyar', 'instamart', 'Adyar Centre', 'Adyar', 'Chennai', '600042', 13.0005, 80.2485, 12, 7],
  ['instamart-maa-velachery', 'instamart', 'Velachery Centre', 'Velachery', 'Chennai', '600070', 12.9695, 80.2165, 13, 7],
  ['amazon-maa-guindy', 'amazon_fresh', 'Guindy Fresh', 'Guindy', 'Chennai', '600106', 13.0125, 80.2165, 12, 8],
  ['amazon-maa-adyar', 'amazon_fresh', 'Adyar Fresh', 'Adyar', 'Chennai', '600042', 13.0005, 80.2655, 12, 7],
  ['flipkart-maa-guindy', 'flipkart_minutes', 'Guindy Minutes', 'Guindy', 'Chennai', '600093', 13.0045, 80.2055, 12, 7],
  ['flipkart-maa-adyar', 'flipkart_minutes', 'Adyar Minutes', 'Adyar', 'Chennai', '600042', 13.0115, 80.2515, 13, 7],

  // ---------------- Kolkata ----------------
  ['blinkit-ccu-park-street', 'blinkit', 'Park Street Hub', 'Park Street', 'Kolkata', '700038', 22.5535, 88.357, 10, 7],
  ['blinkit-ccu-salt-lake', 'blinkit', 'Salt Lake Hub', 'Salt Lake', 'Kolkata', '700061', 22.5931, 88.4046, 11, 7],
  ['blinkit-ccu-behala', 'blinkit', 'Behala Hub', 'Behala', 'Kolkata', '700041', 22.4946, 88.3054, 12, 6],
  ['zepto-ccu-gariahat', 'zepto', 'Gariahat Node', 'Gariahat', 'Kolkata', '700019', 22.5877, 88.3639, 11, 7],
  ['zepto-ccu-ballygunge', 'zepto', 'Ballygunge Node', 'Ballygunge', 'Kolkata', '700045', 22.5222, 88.3637, 12, 7],
  ['instamart-ccu-park-street', 'instamart', 'Park Street Centre', 'Park Street', 'Kolkata', '700017', 22.5605, 88.3485, 12, 7],
  ['instamart-ccu-salt-lake', 'instamart', 'Salt Lake Centre', 'Salt Lake', 'Kolkata', '700061', 22.5885, 88.4155, 12, 7],
  ['amazon-ccu-park-street', 'amazon_fresh', 'Park Street Fresh', 'Park Street', 'Kolkata', '700038', 22.5465, 88.3505, 12, 7],
  ['amazon-ccu-ballygunge', 'amazon_fresh', 'Ballygunge Fresh', 'Ballygunge', 'Kolkata', '700045', 22.5155, 88.3705, 13, 7],
  ['flipkart-ccu-gariahat', 'flipkart_minutes', 'Gariahat Minutes', 'Gariahat', 'Kolkata', '700019', 22.5805, 88.3515, 12, 7],

  // ---------------- Ahmedabad ----------------
  ['blinkit-amd-navrangpura', 'blinkit', 'Navrangpura Hub', 'Navrangpura', 'Ahmedabad', '380021', 23.0372, 72.5671, 10, 7],
  ['blinkit-amd-satellite', 'blinkit', 'Satellite Hub', 'Satellite', 'Ahmedabad', '380027', 23.0309, 72.5135, 11, 7],
  ['zepto-amd-navrangpura', 'zepto', 'Navrangpura Node', 'Navrangpura', 'Ahmedabad', '380021', 23.0425, 72.5595, 11, 7],
  ['zepto-amd-prahlad', 'zepto', 'Prahlad Nagar Node', 'Prahlad Nagar', 'Ahmedabad', '380051', 23.0255, 72.5175, 12, 7],
  ['instamart-amd-navrangpura', 'instamart', 'Navrangpura Centre', 'Navrangpura', 'Ahmedabad', '380009', 23.0485, 72.5755, 11, 8],
  ['instamart-amd-prahlad', 'instamart', 'Prahlad Nagar Centre', 'Prahlad Nagar', 'Ahmedabad', '380051', 23.0385, 72.5025, 12, 7],
  ['amazon-amd-navrangpura', 'amazon_fresh', 'Navrangpura Fresh', 'Navrangpura', 'Ahmedabad', '380019', 23.0335, 72.5805, 12, 7],
  ['amazon-amd-satellite', 'amazon_fresh', 'Satellite Fresh', 'Satellite', 'Ahmedabad', '380027', 23.0235, 72.5045, 13, 7],
  ['flipkart-amd-navrangpura', 'flipkart_minutes', 'Navrangpura Minutes', 'Navrangpura', 'Ahmedabad', '380001', 23.0405, 72.5715, 12, 6],

  // ---------------- Pune ----------------
  ['blinkit-pune-koregaon', 'blinkit', 'Koregaon Park Hub', 'Koregaon Park', 'Pune', '411014', 18.5362, 73.8939, 10, 7],
  ['blinkit-pune-baner', 'blinkit', 'Baner Hub', 'Baner', 'Pune', '411045', 18.5602, 73.7871, 11, 7],
  ['blinkit-pune-kothrud', 'blinkit', 'Kothrud Hub', 'Kothrud', 'Pune', '411030', 18.5074, 73.8077, 11, 7],
  ['zepto-pune-koregaon', 'zepto', 'Koregaon Park Node', 'Koregaon Park', 'Pune', '411014', 18.5305, 73.9015, 11, 7],
  ['zepto-pune-hadapsar', 'zepto', 'Hadapsar Node', 'Hadapsar', 'Pune', '411028', 18.5089, 73.926, 12, 7],
  ['instamart-pune-koregaon', 'instamart', 'Koregaon Park Centre', 'Koregaon Park', 'Pune', '411006', 18.5425, 73.8085, 12, 7],
  ['instamart-pune-baner', 'instamart', 'Baner Centre', 'Baner', 'Pune', '411038', 18.5525, 73.7735, 13, 7],
  ['amazon-pune-koregaon', 'amazon_fresh', 'Koregaon Park Fresh', 'Koregaon Park', 'Pune', '411001', 18.5425, 73.8865, 12, 7],
  ['amazon-pune-baner', 'amazon_fresh', 'Baner Fresh', 'Baner', 'Pune', '411045', 18.5685, 73.7795, 13, 7],
  ['flipkart-pune-baner', 'flipkart_minutes', 'Baner Minutes', 'Baner', 'Pune', '411045', 18.5565, 73.7955, 12, 7],

  // ---------------- Surat ----------------
  ['blinkit-st-adajan', 'blinkit', 'Adajan Hub', 'Adajan', 'Surat', '395010', 21.1892, 72.8081, 10, 7],
  ['blinkit-st-vesu', 'blinkit', 'Vesu Hub', 'Vesu', 'Surat', '395008', 21.1428, 72.7654, 11, 7],
  ['zepto-st-adajan', 'zepto', 'Adajan Node', 'Adajan', 'Surat', '395010', 21.1835, 72.8145, 11, 7],
  ['amazon-st-adajan', 'amazon_fresh', 'Adajan Fresh', 'Adajan', 'Surat', '395012', 21.1755, 72.8015, 12, 7],

  // ---------------- Jaipur ----------------
  ['blinkit-jai-vaishali', 'blinkit', 'Vaishali Nagar Hub', 'Vaishali Nagar', 'Jaipur', '302020', 26.9088, 75.7375, 11, 7],
  ['blinkit-jai-malviya', 'blinkit', 'Malviya Nagar Hub', 'Malviya Nagar', 'Jaipur', '302017', 26.8601, 75.8121, 12, 6],
  ['zepto-jai-mi-road', 'zepto', 'M.I. Road Node', 'M.I. Road', 'Jaipur', '302001', 26.9145, 75.7795, 12, 7],
  ['instamart-jai-vaishali', 'instamart', 'Vaishali Nagar Centre', 'Vaishali Nagar', 'Jaipur', '302021', 26.9025, 75.7285, 13, 6],

  // ---------------- Nagpur ----------------
  ['blinkit-nag-dharampeth', 'blinkit', 'Dharampeth Hub', 'Dharampeth', 'Nagpur', '440011', 21.1458, 79.0553, 11, 6],
  ['blinkit-nag-sadar', 'blinkit', 'Sadar Hub', 'Sadar', 'Nagpur', '440022', 21.1734, 79.0773, 12, 6],
  ['zepto-nag-dharampeth', 'zepto', 'Dharampeth Node', 'Dharampeth', 'Nagpur', '440010', 21.1389, 79.0634, 12, 6],

  // ---------------- Nashik ----------------
  ['blinkit-nas-hcity', 'blinkit', 'Nashik Hub', 'Nashik', 'Nashik', '422001', 19.9975, 73.7898, 12, 6],

  // ---------------- Indore ----------------
  ['blinkit-ind-vijaynagar', 'blinkit', 'Vijay Nagar Hub', 'Vijay Nagar', 'Indore', '452020', 22.7442, 75.8861, 12, 6],
  ['zepto-ind-vijaynagar', 'zepto', 'Vijay Nagar Node', 'Vijay Nagar', 'Indore', '452010', 22.7515, 75.8945, 12, 6],

  // ---------------- Lucknow ----------------
  ['blinkit-lko-gomti', 'blinkit', 'Gomti Nagar Hub', 'Gomti Nagar', 'Lucknow', '226023', 26.8556, 81.0356, 11, 7],
  ['blinkit-lko-hazratganj', 'blinkit', 'Hazratganj Hub', 'Hazratganj', 'Lucknow', '226010', 26.8542, 80.9442, 12, 6],
  ['zepto-lko-gomti', 'zepto', 'Gomti Nagar Node', 'Gomti Nagar', 'Lucknow', '226024', 26.8625, 81.0405, 12, 7],
  ['instamart-lko-hazratganj', 'instamart', 'Hazratganj Centre', 'Hazratganj', 'Lucknow', '226001', 26.8505, 80.9385, 13, 6],

  // ---------------- Coimbatore ----------------
  ['blinkit-cbe-rs-puram', 'blinkit', 'R.S. Puram Hub', 'R.S. Puram', 'Coimbatore', '641011', 11.0053, 76.9498, 11, 6],
  ['zepto-cbe-gandhipuram', 'zepto', 'Gandhipuram Node', 'Gandhipuram', 'Coimbatore', '641032', 11.0265, 76.9745, 12, 6],
];

export const DARK_STORES: DarkStore[] = STORES.map(
  ([id, platform, name, locality, city, pincode, lat, lng, baseEtaMinutes, serviceRadiusKm]) => ({
    id,
    platform,
    name,
    locality,
    city,
    pincode,
    location: { lat, lng },
    baseEtaMinutes,
    serviceRadiusKm,
  }),
);

/** Cities where at least one platform has a dark store. */
export const COVERED_CITIES: string[] = [...new Set(DARK_STORES.map((s) => s.city))].sort();

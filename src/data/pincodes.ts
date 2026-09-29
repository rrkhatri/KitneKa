/**
 * Pincode geography.
 *
 * IMPORTANT: this is a curated starter dataset, not the authoritative India Post
 * directory. It covers the pincodes for the cities the app is launched in and is
 * deliberately isolated in this one file so it can be replaced wholesale with an
 * official India Post PIN code export (or a licensed geospatial provider) without
 * touching any other module. See README -> "Swapping in real location data".
 *
 * Matching is two-stage:
 *   1. exact  — the pincode is in the table
 *   2. zone   — fall back to the centroid of the 3-digit postal zone, flagged
 *               `zone-centroid` so the UI can be honest that the location is an
 *               approximation and the nearest-store answer is approximate too.
 */

export type PincodeRecord = {
  pincode: string;
  locality: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

export type ZoneRecord = {
  zone: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
};

const P: Record<string, [locality: string, city: string, state: string, lat: number, lng: number]> = {
  // ---- Vadodara (Gujarat) ----
  '390001': ['Vadodara H.O.', 'Vadodara', 'Gujarat', 22.3072, 73.1812],
  '390002': ['Fatehgunj', 'Vadodara', 'Gujarat', 22.3168, 73.1932],
  '390003': ['Kotachan', 'Vadodara', 'Gujarat', 22.3155, 73.1722],
  '390004': ['Alkapuri', 'Vadodara', 'Gujarat', 22.3095, 73.1742],
  '390005': ['Akota', 'Vadodara', 'Gujarat', 22.3215, 73.1928],
  '390007': ['Gotri', 'Vadodara', 'Gujarat', 22.3095, 73.2238],
  '390008': ['Manjalpur', 'Vadodara', 'Gujarat', 22.2785, 73.2185],
  '390009': ['Akarpura', 'Vadodara', 'Gujarat', 22.3268, 73.2055],
  '390010': ['Vasna', 'Vadodara', 'Gujarat', 22.2938, 73.1962],
  '390011': ['Nizampura', 'Vadodara', 'Gujarat', 22.3138, 73.2315],
  '390012': ['Ramol', 'Vadodara', 'Gujarat', 22.2685, 73.2265],
  '390015': ['Tarsadi', 'Vadodara', 'Gujarat', 22.2815, 73.2005],
  '390016': ['Haveli', 'Vadodara', 'Gujarat', 22.3505, 73.1752],
  '390017': ['Savli', 'Vadodara', 'Gujarat', 22.5685, 73.1352],
  '390018': ['Karjan', 'Vadodara', 'Gujarat', 22.4895, 73.1392],
  '390019': ['Padra', 'Vadodara', 'Gujarat', 22.2432, 73.0852],
  '390020': ['Dabhoi', 'Vadodara', 'Gujarat', 22.2475, 73.0062],
  '390021': ['Waghodia', 'Vadodara', 'Gujarat', 22.2415, 73.1522],
  '390023': ['Kalali', 'Vadodara', 'Gujarat', 22.2625, 73.2185],

  // ---- Mumbai (Maharashtra) ----
  '400001': ['Fort', 'Mumbai', 'Maharashtra', 18.9348, 72.8347],
  '400005': ['Dadar', 'Mumbai', 'Maharashtra', 19.018, 72.8437],
  '400013': ['Dadar West', 'Mumbai', 'Maharashtra', 19.0235, 72.8372],
  '400014': ['Matunga', 'Mumbai', 'Maharashtra', 19.0325, 72.8572],
  '400019': ['Sion', 'Mumbai', 'Maharashtra', 19.0544, 72.9002],
  '400022': ['Sion Koliwada', 'Mumbai', 'Maharashtra', 19.0501, 72.9092],
  '400036': ['Powai', 'Mumbai', 'Maharashtra', 19.1315, 72.9012],
  '400043': ['Andheri East', 'Mumbai', 'Maharashtra', 19.1136, 72.8697],
  '400053': ['Andheri East', 'Mumbai', 'Maharashtra', 19.1281, 72.8342],
  '400050': ['Bandra West', 'Mumbai', 'Maharashtra', 19.0544, 72.8347],
  '400055': ['Bandra East', 'Mumbai', 'Maharashtra', 19.0607, 72.8572],
  '400058': ['Vile Parle West', 'Mumbai', 'Maharashtra', 19.0607, 72.8378],
  '400061': ['Bandra Reclamation', 'Mumbai', 'Maharashtra', 19.0622, 72.8392],
  '400064': ['Malad West', 'Mumbai', 'Maharashtra', 19.1879, 72.8441],
  '400066': ['Borivali West', 'Mumbai', 'Maharashtra', 19.2291, 72.8567],
  '400067': ['Vile Parle East', 'Mumbai', 'Maharashtra', 19.0805, 72.8461],
  '400070': ['Kurla', 'Mumbai', 'Maharashtra', 19.0815, 72.8856],
  '400072': ['Malad East', 'Mumbai', 'Maharashtra', 19.1857, 72.8662],
  '400074': ['Borivali East', 'Mumbai', 'Maharashtra', 19.2294, 72.8572],
  '400076': ['Powai', 'Mumbai', 'Maharashtra', 19.1176, 72.9062],
  '400080': ['Borivali East', 'Mumbai', 'Maharashtra', 19.2229, 72.8922],

  // ---- Bengaluru (Karnataka) ----
  '560001': ['Chinnaswamy', 'Bengaluru', 'Karnataka', 12.9629, 77.605],
  '560002': ['Bengaluru GPO', 'Bengaluru', 'Karnataka', 12.9609, 77.5763],
  '560017': ['Indiranagar', 'Bengaluru', 'Karnataka', 12.9719, 77.6412],
  '560025': ['Indiranagar', 'Bengaluru', 'Karnataka', 12.9667, 77.6366],
  '560034': ['Koramangala', 'Bengaluru', 'Karnataka', 12.9352, 77.6245],
  '560038': ['Jayanagar', 'Bengaluru', 'Karnataka', 12.9275, 77.5837],
  '560041': ['Subramanyapura', 'Bengaluru', 'Karnataka', 12.9333, 77.6833],
  '560050': ['Bengaluru South', 'Bengaluru', 'Karnataka', 12.9583, 77.5562],
  '560055': ['Banashankari', 'Bengaluru', 'Karnataka', 12.9212, 77.5737],
  '560064': ['HSR Layout', 'Bengaluru', 'Karnataka', 12.9116, 77.6474],
  '560066': ['Whitefield', 'Bengaluru', 'Karnataka', 12.9698, 77.7509],
  '560068': ['Marathahalli', 'Bengaluru', 'Karnataka', 12.9591, 77.6974],
  '560070': ['Bellandur', 'Bengaluru', 'Karnataka', 12.8903, 77.6793],
  '560076': ['Jayanagar', 'Bengaluru', 'Karnataka', 12.9251, 77.5462],
  '560087': ['Marathahalli', 'Bengaluru', 'Karnataka', 12.9442, 77.7216],
  '560100': ['Electronic City', 'Bengaluru', 'Karnataka', 12.8452, 77.6602],

  // ---- Delhi NCR (Delhi) ----
  '110001': ['Connaught Place', 'Delhi', 'Delhi', 28.6315, 77.2167],
  '110002': ['Darya Ganj', 'Delhi', 'Delhi', 28.6448, 77.2167],
  '110006': ['Darya Ganj', 'Delhi', 'Delhi', 28.6502, 77.2298],
  '110012': ['Palam', 'Delhi', 'Delhi', 28.5918, 77.0923],
  '110016': ['Nehru Place', 'Delhi', 'Delhi', 28.5489, 77.2562],
  '110017': ['Kalkaji', 'Delhi', 'Delhi', 28.5355, 77.2588],
  '110019': ['Patel Nagar', 'Delhi', 'Delhi', 28.6448, 77.2373],
  '110024': ['Laxmi Nagar', 'Delhi', 'Delhi', 28.6328, 77.2473],
  '110032': ['Shahdara', 'Delhi', 'Delhi', 28.6812, 77.3105],
  '110037': ['Karol Bagh', 'Delhi', 'Delhi', 28.6519, 77.1909],
  '110041': ['Pitampura', 'Delhi', 'Delhi', 28.6502, 77.1123],
  '110049': ['Janakpuri', 'Delhi', 'Delhi', 28.6295, 77.0757],
  '110054': ['Lajpat Nagar', 'Delhi', 'Delhi', 28.5974, 77.2433],
  '110062': ['Preet Vihar', 'Delhi', 'Delhi', 28.6417, 77.2953],
  '110066': ['Greater Kailash', 'Delhi', 'Delhi', 28.5309, 77.2431],
  '110070': ['Dwarka', 'Delhi', 'Delhi', 28.5921, 77.046],
  '110075': ['Rohini', 'Delhi', 'Delhi', 28.7135, 77.1167],
  '110092': ['Pitampura', 'Delhi', 'Delhi', 28.6295, 77.0985],

  // ---- Hyderabad (Telangana) ----
  '500001': ['Hyderabad GPO', 'Hyderabad', 'Telangana', 17.3845, 78.4875],
  '500002': ['Hyderabad', 'Hyderabad', 'Telangana', 17.3785, 78.4822],
  '500003': ['Himayatnagar', 'Hyderabad', 'Telangana', 17.4239, 78.4731],
  '500007': ['Secunderabad', 'Hyderabad', 'Telangana', 17.4399, 78.4983],
  '500026': ['Secunderabad', 'Hyderabad', 'Telangana', 17.4596, 78.4791],
  '500032': ['Gachibowli', 'Hyderabad', 'Telangana', 17.4401, 78.3486],
  '500036': ['Banjara Hills', 'Hyderabad', 'Telangana', 17.4239, 78.4486],
  '500038': ['Banjara Hills', 'Hyderabad', 'Telangana', 17.4126, 78.4452],
  '500045': ['Jubilee Hills', 'Hyderabad', 'Telangana', 17.4291, 78.4056],
  '500049': ['Secunderabad', 'Hyderabad', 'Telangana', 17.4305, 78.5362],
  '500072': ['Jubilee Hills', 'Hyderabad', 'Telangana', 17.4244, 78.4021],
  '500081': ['Kondapur', 'Hyderabad', 'Telangana', 17.4593, 78.3623],

  // ---- Chennai (Tamil Nadu) ----
  '600001': ["Parry's Corner", 'Chennai', 'Tamil Nadu', 13.0797, 80.2901],
  '600002': ['George Town', 'Chennai', 'Tamil Nadu', 13.0917, 80.2881],
  '600010': ['Triplicane', 'Chennai', 'Tamil Nadu', 13.0555, 80.2806],
  '600016': ['Thousand Lights', 'Chennai', 'Tamil Nadu', 13.0423, 80.3053],
  '600018': ['Thousand Lights', 'Chennai', 'Tamil Nadu', 13.0302, 80.3035],
  '600020': ['Chetpet', 'Chennai', 'Tamil Nadu', 13.0219, 80.2806],
  '600042': ['Adyar', 'Chennai', 'Tamil Nadu', 13.0067, 80.257],
  '600061': ['Velachery', 'Chennai', 'Tamil Nadu', 12.9754, 80.2214],
  '600083': ['Alandur', 'Chennai', 'Tamil Nadu', 12.9932, 80.2016],
  '600093': ['Guindy', 'Chennai', 'Tamil Nadu', 13.0067, 80.2206],
  '600106': ['Guindy', 'Chennai', 'Tamil Nadu', 13.0067, 80.2249],

  // ---- Kolkata (West Bengal) ----
  '700001': ['BBD Bagh', 'Kolkata', 'West Bengal', 22.5697, 88.3503],
  '700017': ['Park Street', 'Kolkata', 'West Bengal', 22.5569, 88.3511],
  '700019': ['Gariahat', 'Kolkata', 'West Bengal', 22.5877, 88.3639],
  '700026': ['Alipore', 'Kolkata', 'West Bengal', 22.5351, 88.3412],
  '700029': ['Alipore', 'Kolkata', 'West Bengal', 22.5401, 88.3345],
  '700038': ['Park Street', 'Kolkata', 'West Bengal', 22.5535, 88.357],
  '700041': ['Behala', 'Kolkata', 'West Bengal', 22.4946, 88.3054],
  '700045': ['Ballygunge', 'Kolkata', 'West Bengal', 22.5222, 88.3637],
  '700061': ['Salt Lake', 'Kolkata', 'West Bengal', 22.5931, 88.4046],
  '700091': ['New Town', 'Kolkata', 'West Bengal', 22.5801, 88.4637],
  '700092': ['Behala', 'Kolkata', 'West Bengal', 22.5012, 88.3132],
  '700156': ['Rajarhat', 'Kolkata', 'West Bengal', 22.5805, 88.4446],

  // ---- Ahmedabad (Gujarat) ----
  '380001': ['Ahmedabad H.O.', 'Ahmedabad', 'Gujarat', 23.0333, 72.5667],
  '380006': ['Ahmedabad City', 'Ahmedabad', 'Gujarat', 23.0389, 72.5712],
  '380007': ['Ahmedabad', 'Ahmedabad', 'Gujarat', 23.0441, 72.5802],
  '380009': ['Ahmedabad', 'Ahmedabad', 'Gujarat', 23.0503, 72.5822],
  '380015': ['Ahmedabad H.O.', 'Ahmedabad', 'Gujarat', 23.0294, 72.5667],
  '380019': ['Gordhan Nagar', 'Ahmedabad', 'Gujarat', 23.0459, 72.5881],
  '380021': ['Navrangpura', 'Ahmedabad', 'Gujarat', 23.0372, 72.5671],
  '380024': ['Sandar Nagar', 'Ahmedabad', 'Gujarat', 23.0408, 72.5706],
  '380027': ['Satellite', 'Ahmedabad', 'Gujarat', 23.0309, 72.5135],
  '380051': ['Prahlad Nagar', 'Ahmedabad', 'Gujarat', 23.0322, 72.5122],
  '380059': ['Bodakdev', 'Ahmedabad', 'Gujarat', 23.0405, 72.5295],

  // ---- Pune (Maharashtra) ----
  '411001': ['Pune H.O.', 'Pune', 'Maharashtra', 18.5196, 73.8779],
  '411004': ['Pune Camp', 'Pune', 'Maharashtra', 18.5127, 73.8785],
  '411006': ['Aundh', 'Pune', 'Maharashtra', 18.5598, 73.8072],
  '411007': ['Aundh', 'Pune', 'Maharashtra', 18.559, 73.807],
  '411014': ['Koregaon Park', 'Pune', 'Maharashtra', 18.5362, 73.8939],
  '411016': ['Pimpri', 'Pune', 'Maharashtra', 18.6298, 73.7997],
  '411020': ['Shivajinagar', 'Pune', 'Maharashtra', 18.5308, 73.8478],
  '411030': ['Kothrud', 'Pune', 'Maharashtra', 18.5074, 73.8077],
  '411038': ['Baner', 'Pune', 'Maharashtra', 18.5642, 73.7769],
  '411041': ['Karve Nagar', 'Pune', 'Maharashtra', 18.4916, 73.8636],
  '411045': ['Baner', 'Pune', 'Maharashtra', 18.5602, 73.7871],
  '411057': ['Pashan', 'Pune', 'Maharashtra', 18.5513, 73.7906],

  // ---- Surat (Gujarat) ----
  '395001': ['Surat H.O.', 'Surat', 'Gujarat', 21.1702, 72.8311],
  '395002': ['Surat', 'Surat', 'Gujarat', 21.1833, 72.8333],
  '395003': ['Surat', 'Surat', 'Gujarat', 21.1833, 72.85],
  '395004': ['Surat', 'Surat', 'Gujarat', 21.1702, 72.8411],
  '395006': ['Katargam', 'Surat', 'Gujarat', 21.2191, 72.8345],
  '395007': ['Surat', 'Surat', 'Gujarat', 21.1667, 72.8333],
  '395008': ['Vesu', 'Surat', 'Gujarat', 21.1428, 72.7654],
  '395010': ['Adajan', 'Surat', 'Gujarat', 21.1892, 72.8081],
  '395012': ['Adajan', 'Surat', 'Gujarat', 21.1822, 72.8081],

  // ---- Jaipur (Rajasthan) ----
  '302001': ['Jaipur H.O.', 'Jaipur', 'Rajasthan', 26.9124, 75.7873],
  '302002': ['M.I. Road', 'Jaipur', 'Rajasthan', 26.9124, 75.7873],
  '302003': ['Jaipur', 'Jaipur', 'Rajasthan', 26.9156, 75.7873],
  '302006': ['Ajmeri Gate', 'Jaipur', 'Rajasthan', 26.9071, 75.8121],
  '302013': ['Malviya Nagar', 'Jaipur', 'Rajasthan', 26.8551, 75.8121],
  '302017': ['Malviya Nagar', 'Jaipur', 'Rajasthan', 26.8601, 75.8121],
  '302020': ['Vaishali Nagar', 'Jaipur', 'Rajasthan', 26.9088, 75.7375],
  '302021': ['Vaishali Nagar', 'Jaipur', 'Rajasthan', 26.9058, 75.7355],
  '302039': ['Jagatpura', 'Jaipur', 'Rajasthan', 26.8832, 75.7693],

  // ---- Nagpur (Maharashtra) ----
  '440001': ['Nagpur H.O.', 'Nagpur', 'Maharashtra', 21.1458, 79.0882],
  '440002': ['Sitabuldi', 'Nagpur', 'Maharashtra', 21.1458, 79.0815],
  '440010': ['Dharampeth', 'Nagpur', 'Maharashtra', 21.1389, 79.0634],
  '440011': ['Dharampeth', 'Nagpur', 'Maharashtra', 21.1458, 79.0553],
  '440022': ['Sadar', 'Nagpur', 'Maharashtra', 21.1734, 79.0773],
  '440026': ['Manish Nagar', 'Nagpur', 'Maharashtra', 21.0989, 79.0579],
  '440027': ['Manish Nagar', 'Nagpur', 'Maharashtra', 21.1092, 79.0553],

  // ---- Nashik (Maharashtra) ----
  '422001': ['Nashik H.O.', 'Nashik', 'Maharashtra', 19.9975, 73.7898],
  '422002': ['Nashik', 'Nashik', 'Maharashtra', 19.9538, 73.7898],
  '422003': ['Nashik', 'Nashik', 'Maharashtra', 19.9624, 73.7867],
  '422005': ['Nashik', 'Nashik', 'Maharashtra', 19.9889, 73.7917],
  '422006': ['Nashik', 'Nashik', 'Maharashtra', 19.9952, 73.7903],
  '422009': ['Nashik', 'Nashik', 'Maharashtra', 20.0085, 73.7745],

  // ---- Indore (Madhya Pradesh) ----
  '452001': ['Indore H.O.', 'Indore', 'Madhya Pradesh', 22.7186, 75.8578],
  '452002': ['Indore', 'Indore', 'Madhya Pradesh', 22.7186, 75.8833],
  '452003': ['Indore', 'Indore', 'Madhya Pradesh', 22.7122, 75.8775],
  '452009': ['Indore', 'Indore', 'Madhya Pradesh', 22.6901, 75.8784],
  '452010': ['Vijay Nagar', 'Indore', 'Madhya Pradesh', 22.7532, 75.8942],
  '452020': ['Vijay Nagar', 'Indore', 'Madhya Pradesh', 22.7442, 75.8861],

  // ---- Lucknow (Uttar Pradesh) ----
  '226001': ['Lucknow H.O.', 'Lucknow', 'Uttar Pradesh', 26.8467, 80.9462],
  '226003': ['Lucknow', 'Lucknow', 'Uttar Pradesh', 26.8556, 80.9312],
  '226010': ['Hazratganj', 'Lucknow', 'Uttar Pradesh', 26.8542, 80.9442],
  '226022': ['Alambagh', 'Lucknow', 'Uttar Pradesh', 26.8085, 80.9456],
  '226023': ['Gomti Nagar', 'Lucknow', 'Uttar Pradesh', 26.8556, 81.0356],
  '226024': ['Gomti Nagar', 'Lucknow', 'Uttar Pradesh', 26.8525, 81.0285],

  // ---- Coimbatore (Tamil Nadu) ----
  '641001': ['Coimbatore H.O.', 'Coimbatore', 'Tamil Nadu', 11.0173, 76.9678],
  '641005': ['Coimbatore', 'Coimbatore', 'Tamil Nadu', 11.0113, 76.9608],
  '641011': ['R.S. Puram', 'Coimbatore', 'Tamil Nadu', 11.0053, 76.9498],
  '641012': ['R.S. Puram', 'Coimbatore', 'Tamil Nadu', 11.0073, 76.9658],
  '641016': ['Ukkadam', 'Coimbatore', 'Tamil Nadu', 11.0023, 76.9708],
  '641032': ['Gandhipuram', 'Coimbatore', 'Tamil Nadu', 11.0323, 76.9818],
};

/** 3-digit zone centroids, derived from the exact table above plus known city
 *  centres, used when a pincode is not in the table. */
const Z: Record<string, [city: string, state: string, lat: number, lng: number]> = {
  '110': ['Delhi', 'Delhi', 28.6139, 77.209],
  '122': ['Gurgaon', 'Haryana', 28.4595, 77.0266],
  '201': ['Ghaziabad', 'Uttar Pradesh', 28.6692, 77.4538],
  '226': ['Lucknow', 'Uttar Pradesh', 26.8467, 80.9462],
  '380': ['Ahmedabad', 'Gujarat', 23.0225, 72.5714],
  '390': ['Vadodara', 'Gujarat', 22.3072, 73.1812],
  '395': ['Surat', 'Gujarat', 21.1702, 72.8311],
  '400': ['Mumbai', 'Maharashtra', 19.076, 72.8777],
  '411': ['Pune', 'Maharashtra', 18.5204, 73.8567],
  '422': ['Nashik', 'Maharashtra', 19.9975, 73.7898],
  '440': ['Nagpur', 'Maharashtra', 21.1458, 79.0882],
  '452': ['Indore', 'Madhya Pradesh', 22.7196, 75.8577],
  '500': ['Hyderabad', 'Telangana', 17.385, 78.4867],
  '560': ['Bengaluru', 'Karnataka', 12.9716, 77.5946],
  '600': ['Chennai', 'Tamil Nadu', 13.0827, 80.2707],
  '641': ['Coimbatore', 'Tamil Nadu', 11.0168, 76.9558],
  '700': ['Kolkata', 'West Bengal', 22.5726, 88.3639],
  '302': ['Jaipur', 'Rajasthan', 26.9124, 75.7873],
  '682': ['Kochi', 'Kerala', 9.9312, 76.2673],
  '695': ['Thiruvananthapuram', 'Kerala', 8.5241, 76.9366],
  '781': ['Guwahati', 'Assam', 26.1445, 91.7362],
  '751': ['Bhubaneswar', 'Odisha', 20.2961, 85.8245],
  '208': ['Kanpur', 'Uttar Pradesh', 26.4499, 80.3319],
  '462': ['Bhopal', 'Madhya Pradesh', 23.2599, 77.4126],
  '141': ['Ludhiana', 'Punjab', 30.901, 75.8573],
  '160': ['Chandigarh', 'Chandigarh', 30.7333, 76.7794],
  '248': ['Dehradun', 'Uttarakhand', 30.3165, 78.0322],
  '734': ['Siliguri', 'West Bengal', 26.7271, 88.3953],
  '530': ['Visakhapatnam', 'Andhra Pradesh', 17.6868, 83.2185],
  '533': ['Guntur', 'Andhra Pradesh', 16.3067, 80.4365],
  '144': ['Amritsar', 'Punjab', 31.634, 74.8723],
};

export const PINCODE_LOCATIONS: Record<string, PincodeRecord> = Object.fromEntries(
  Object.entries(P).map(([pincode, [locality, city, state, lat, lng]]) => [
    pincode,
    { pincode, locality, city, state, lat, lng },
  ]),
);

export const ZONE_CENTROIDS: Record<string, ZoneRecord> = Object.fromEntries(
  Object.entries(Z).map(([zone, [city, state, lat, lng]]) => [zone, { zone, city, state, lat, lng }]),
);

/** Popular pincodes surfaced as quick-pick chips in the UI. */
export const FEATURED_PINCODES: string[] = [
  '390007', // Gotri, Vadodara
  '390001', // Vadodara H.O.
  '380015', // Ahmedabad
  '395007', // Surat
  '400058', // Vile Parle West, Mumbai
  '400072', // Malad East, Mumbai
  '411045', // Baner, Pune
  '560066', // Whitefield, Bengaluru
  '560034', // Koramangala, Bengaluru
  '110070', // Dwarka, Delhi
  '110019', // Patel Nagar, Delhi
  '500032', // Gachibowli, Hyderabad
  '600093', // Guindy, Chennai
  '700038', // Park Street, Kolkata
  '302020', // Vaishali Nagar, Jaipur
];

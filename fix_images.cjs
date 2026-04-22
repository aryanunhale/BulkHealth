const fs = require('fs');
const path = require('path');

const IMAGE_MAP = {
  '"/products/mb_biozyme_whey.png"':    '"https://img5.hkrtcdn.com/26479/prd_2647844-MuscleBlaze-Biozyme-Performance-Whey-Protein-2.2-lb-Chocolate-Hazelnut_o.jpg"',
  '"/products/asitis_whey.png"':        '"https://img9.hkrtcdn.com/1168/prd_116748_o.jpg"',
  '"/products/nakpro_whey.png"':        '"https://img8.hkrtcdn.com/21736/prd_2173529-Nakpro-Perform-Whey-Protein-Powder-2-kg-Chocolate_o.jpg"',
  '"/products/on_gold_standard.png"':   '"https://img10.hkrtcdn.com/41385/prd_4138469-ON-Optimum-Nutrition-Gold-Standard-100-Whey-Protein-2-lb-Double-Rich-Chocolate_o.jpg"',
  '"/products/dymatize_iso100.png"':    '"https://img9.hkrtcdn.com/20571/prd_2057063-Dymatize-ISO100-Hydrolyzed-Protein-Powder-5-lb-Gourmet-Chocolate_o.jpg"',
  '"/products/mff_whey.png"':           '"https://img4.hkrtcdn.com/9100/prd_909920-MFF-100-Whey-Protein-Powder-1-kg-Chocolate_o.jpg"',
  '"/products/myprotein_whey.png"':     '"https://img3.hkrtcdn.com/26011/prd_2601029-Myprotein-Impact-Whey-Protein-1-kg-Chocolate-Smooth_o.jpg"',
  '"/products/bigflex_whey.png"':       '"https://img8.hkrtcdn.com/22000/prd_2199934-Bigflex-Essential-Whey-Protein-2-kg-Chocolate_o.jpg"',
  '"/products/mb_preworkout.png"':      '"https://img8.hkrtcdn.com/30067/prd_3006639-MuscleBlaze-PRE-Fire-Pre-Workout-250-g-Watermelon_o.jpg"',
  '"/products/c4_original.png"':        '"https://img5.hkrtcdn.com/18994/prd_1899356-Cellucor-C4-Original-Pre-Workout-390-g-Fruit-Punch_o.jpg"',
  '"/products/hkvitals_creatine.png"':  '"https://img2.hkrtcdn.com/38900/prd_3889981-MuscleBlaze-Micronised-Creatine-Monohydrate-Unflavoured-250-g_o.jpg"',
  '"/products/on_creatine.png"':        '"https://img9.hkrtcdn.com/3649/prd_364855-Optimum-Nutrition-Gold-Standard-Creatine-634-g-Unflavored_o.jpg"',
  '"/products/thorne_creatine.png"':    '"https://img5.hkrtcdn.com/33862/prd_3386115-Thorne-Creatine-16-oz-Unflavored_o.jpg"',
  '"/products/fastup_bcaa.png"':        '"https://img8.hkrtcdn.com/11793/prd_1179236-Fast-Up-Recover-BCAAs-Berry-Blast_o.jpg"',
  '"/products/bigmuscles_mass.png"':    '"https://img7.hkrtcdn.com/18063/prd_1806202-Big-Muscles-Nutrition-Real-Mass-Gainer-11-lb-Ice-Cream-Chocolate_o.jpg"',
  '"/products/healthfarm_whey.png"':    '"https://img9.hkrtcdn.com/30186/prd_3018521-Healthfarm-Massive-Whey-Gainer-3-kg-Chocolate-Cream_o.jpg"',
  '"/products/on_serious_mass.png"':    '"https://img9.hkrtcdn.com/4048/prd_404736-Optimum-Nutrition-Serious-Mass-6-lb-Chocolate_o.jpg"',
  '"/products/ritebite_bar.png"':       '"https://img7.hkrtcdn.com/8285/prd_828429-RiteBite-Max-Protein-Active-67g-Bar-Choco-Fudge_o.jpg"',
  '"/products/mb_multivitamin.png"':    '"https://img6.hkrtcdn.com/14397/prd_1439628-MuscleBlaze-MB-Vite-Daily-Multivitamin-60-Tablets_o.jpg"',
  '"/products/mb_fatburner.png"':       '"https://img3.hkrtcdn.com/20027/prd_2002658-MuscleBlaze-Fat-Burner-PRO-180-Capsules_o.jpg"',
  '"/products/hydroxycut_elite.png"':   '"https://img0.hkrtcdn.com/10748/prd_1074724-Muscletech-Hydroxycut-Hardcore-Elite-100-Capsules_o.jpg"',
  '"/products/now_omega3.png"':         '"https://img3.hkrtcdn.com/14817/prd_1481646-Now-Foods-Ultra-Omega-3-500-EPA-250-DHA-180-Softgels_o.jpg"',
  '"/products/mb_omega3.png"':          '"https://img4.hkrtcdn.com/23052/prd_2305133-MuscleBlaze-Omega-3-90-Softgels_o.jpg"',
  '"/products/wow_omega3.png"':         '"https://img5.hkrtcdn.com/15403/prd_1540238-WOW-Life-Science-Omega-3-Fish-Oil-60-Soft-Gel-Capsules_o.jpg"',
  '"/products/mb_glutamine.png"':       '"https://img5.hkrtcdn.com/11700/prd_1169945-MuscleBlaze-L-Glutamine-250-g-Unflavourd_o.jpg"',
  '"/products/on_glutamine.png"':       '"https://img4.hkrtcdn.com/4090/prd_408943-Optimum-Nutrition-Glutamine-300-g-Unflavored_o.jpg"',
  '"/products/mb_zma.png"':             '"https://img0.hkrtcdn.com/13285/prd_1328460-MuscleBlaze-ZMA-with-Vitamin-B6-90-Capsules_o.jpg"',
  '"/products/now_zma.png"':            '"https://img1.hkrtcdn.com/3705/prd_370446-Now-Foods-ZMA-180-Capsules_o.jpg"',
  '"/products/fastup_reload.png"':      '"https://img3.hkrtcdn.com/12261/prd_1226028-Fast-Up-Reload-Electrolytes-Nimbu-Paani-20-Tablets_o.jpg"',
  '"/products/nuun_sport.png"':         '"https://img7.hkrtcdn.com/18524/prd_1852353-Nuun-Sport-Lemon-Lime-10-Tabs_o.jpg"',
};

const filePath = path.join(__dirname, 'src', 'data', 'products.js');
let content = fs.readFileSync(filePath, 'utf8');

let replacements = 0;
for (const [oldVal, newVal] of Object.entries(IMAGE_MAP)) {
  if (content.includes(oldVal)) {
    content = content.replaceAll(oldVal, newVal);
    replacements++;
  }
}

fs.writeFileSync(filePath, content, 'utf8');
const cdnHits = (content.match(/hkrtcdn/g) || []).length;
console.log(`Done. Replacements: ${replacements}. CDN URLs in file: ${cdnHits}. Lines: ${content.split('\n').length}`);

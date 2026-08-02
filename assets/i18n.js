document.write('<script src="assets/config.js"></script>');
document.write('<script src="assets/translations.js"></script>');

function setLanguage(lang) {
    if (!i18nData[lang]) lang = 'en';
    localStorage.setItem('rcs_lang', lang);

    // 1. Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18nData[lang] && i18nData[lang][key]) {
            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = i18nData[lang][key];
            } else {
                el.innerHTML = i18nData[lang][key];
            }
        }
    });

    // 2. Translate common UI elements
    const dict = commonUiDict[lang] || commonUiDict['en'];
    document.querySelectorAll('.tab-item, .btn-top, .btn-top-main, .btn-top-sec, .grp-label, label, legend, th').forEach(el => {
        let orig = el.getAttribute('data-orig-text');
        if (!orig) {
            orig = el.textContent.trim();
            el.setAttribute('data-orig-text', orig);
        }

        if (dict[orig]) {
            let iconHtml = '';
            const icon = el.querySelector('i');
            if (icon) iconHtml = icon.outerHTML + ' ';
            el.innerHTML = iconHtml + dict[orig];
        }
    });

    // 3. Update active states on language selector buttons
    document.querySelectorAll('.lang-btn').forEach(b => {
        if (b.getAttribute('data-lang') === lang) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // Update global share/help button text on language switch
    const globalShareBtn = document.querySelector(".btn-share-global");
    if (globalShareBtn) {
        let shareText = "Share Tool Link";
        if (lang === 'gu') shareText = "ટૂલ લિંક મોકલો";
        else if (lang === 'hi') shareText = "टूल लिंक भेजें";
        globalShareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> ' + shareText;
    }
    const globalHelpBtn = document.querySelector(".btn-help-global");
    if (globalHelpBtn) {
        let helpText = "Help";
        if (lang === 'gu') helpText = "કેવી રીતે વાપરવું?";
        else if (lang === 'hi') helpText = "कैसे उपयोग करें?";
        globalHelpBtn.innerHTML = '<i class="fas fa-question-circle"></i> ' + helpText;
    }

    // 4. Dynamically update tab title based on current tool name
    const toolNameEl = document.querySelector('.header-tool-name');
    if (toolNameEl) {
        const toolKey = toolNameEl.getAttribute('data-i18n');
        if (i18nData[lang] && i18nData[lang][toolKey]) {
            const suiteText = i18nData[lang]['suite_title'] || "Digital Tools Hub";
            const toolText = i18nData[lang][toolKey];
            document.title = `${toolText} - ${suiteText}`;
        }
    }
}

// ==========================================
// GLOBAL INTERACTIVE ONBOARDING TOUR & SHARE
// ==========================================
(function () {
    let helpCurrentSlide = 1;
    // Specific help datasets for every tool in the suite
    const helpDataMap = {
        en: {
            interest: {
                title: "📈 Simple & Monthly Interest Help",
                steps: [
                    "Enter the Principal Amount (loan or deposit sum).",
                    "Enter the Interest Rate (percent per month or year).",
                    "Choose the Interest Type (Monthly village interest or Annual bank interest).",
                    "Enter the Total Months duration."
                ],
                example: "Example: ₹50,000 principal at 2% monthly rate for 12 months will generate ₹12,000 interest (Total ₹62,000)."
            },
            gst: {
                title: "🧾 Add & Remove GST Help",
                steps: [
                    "Enter the Net base Amount.",
                    "Choose the GST Tax Rate percentage (5%, 12%, 18%, 28%).",
                    "Select whether you want to Add GST or Extract/Remove GST from the amount."
                ],
                example: "Example: ₹10,000 at 18% 'Add GST' will output ₹1,800 tax and ₹11,800 total."
            },
            emi: {
                title: "🏦 Bank Loan Monthly EMI Help",
                steps: [
                    "Enter the Loan Principal Amount.",
                    "Enter the Annual Interest Rate (%).",
                    "Enter the Loan Tenure Duration (Years)."
                ],
                example: "Example: ₹1,00,000 loan at 8.5% for 5 years will cost ₹2,052 per month EMI."
            },
            margin: {
                title: "📈 Profit Margin & Markup Help",
                steps: [
                    "Enter the Cost Price of the item.",
                    "Enter the Selling Price of the item.",
                    "The tool calculates the gross profit margin and markup instantly."
                ],
                example: "Example: Cost ₹150, Sold at ₹200 will yield ₹50 Net Profit (25% Margin, 33.3% Markup)."
            },
            wage: {
                title: "💼 Daily Worker Wage & Overtime Help",
                steps: [
                    "Enter the Daily Pay Wage rate.",
                    "Enter the total Days Present.",
                    "Enter Advance Taken (Upad) to deduct.",
                    "Add Overtime hours and hourly overtime rate."
                ],
                example: "Example: 26 days at ₹450/day wage, minus ₹1000 advance plus 10 OT hours at ₹75/hr = ₹11,450 net pay."
            },
            partnership: {
                title: "🤝 Partnership Profit Division Help",
                steps: [
                    "Enter names and capital investments for Partner A and Partner B.",
                    "Enter the total Profit or Loss amount to divide.",
                    "Select Allocation Type (Profit or Loss)."
                ],
                example: "Example: A invests ₹50,000, B invests ₹30,000. ₹16,000 profit splits as A: ₹10,000 (62.5%), B: ₹6,000 (37.5%)."
            },
            crop_bag: {
                title: "🌾 APMC Yield & Bag Price Help",
                steps: [
                    "Enter the Total Sacks/Bags Count.",
                    "Enter the Average Weight per Bag (kg).",
                    "Enter empty bag tare deduction weight (kg/bag).",
                    "Enter the Crop Price Rate and unit basis (Per Mann / Per kg / Per Quintal)."
                ],
                example: "Example: 50 bags at 40kg average weight (0.5kg tare) at ₹1300 per Mann rate yields ₹1,28,375 payout."
            },
            pisaai: {
                title: "🌾 Atta Chakki Pisaai Parchi Help",
                steps: [
                    "Enter the Grain Weight in kg.",
                    "Enter the Grinding Rate price per kg.",
                    "Enter Katar/Waste deduction in grams per kg."
                ],
                example: "Example: 25 kg grain at ₹5/kg costs ₹125 grinding bill. Katar deduction is 250 grams."
            },
            tractor: {
                title: "🚜 Tractor & Harvester Rental Help",
                steps: [
                    "Select Rental Basis Type (Hourly or Per Vigha).",
                    "Enter the Rental Rate price per unit.",
                    "Enter the total Quantity Worked."
                ],
                example: "Example: 4.5 hours of tractor work at ₹500/hr costs ₹2,250 rental bill."
            },
            time_calc: {
                title: "⏱️ Duration & Time Offset Help",
                steps: [
                    "Select Start Time and End Time to find raw duration.",
                    "To apply an adjustment offset (like a lunch break), select Subtract/Add and enter adjustment Hours & Minutes."
                ],
                example: "Example: 8:30 AM to 5:30 PM (9 hrs) minus 1 hr 30 mins adjustment results in 7 hrs 30 mins net time."
            },
            date_calc: {
                title: "📅 Date Difference & Offset Help",
                steps: [
                    "Select Start Date and End Date to find raw days difference.",
                    "To apply adjustments, enter Days, Weeks, or Months to Add/Subtract."
                ],
                example: "Example: Start to End date is 10 days, plus 1 week (7 days) adjustment results in 17 net days."
            },
            ad: {
                title: "🎴 Visiting Card Pro Help",
                steps: [
                    "Enter Company Name, Designation, Owner, Phone, Email, and Address.",
                    "Upload a logo image or select from pre-installed professional icons.",
                    "Choose a modern background design pattern or custom layout colors.",
                    "Click 'Print Card' to export a sheet of 10 print-ready business cards."
                ],
                example: "Note: Laying out 10 business cards dynamically onto a single A4 page makes local printing quick and low-cost!"
            },
            vcard: {
                title: "🎀 Digital vCard Crafter Help",
                steps: [
                    "Enter profile photo, title name, designations, and phone numbers.",
                    "Add interactive social media buttons (WhatsApp, Facebook, Maps location).",
                    "Select design layout background colors.",
                    "Click 'Download VCF' to generate the virtual card file so clients save your contacts with 1 click."
                ],
                example: "Note: Sharing the dynamic vcard page link enables clients to contact or navigate to you instantly!"
            },
            catalog: {
                title: "🛍️ Product Catalog & Brochure Help",
                steps: [
                    "Fill in your Store name, tagline, and contact information.",
                    "Add items: upload photos, write description titles, and specify rates/prices.",
                    "Group items under specific category sections.",
                    "Click 'Print Brochure / PDF' to save your catalog list."
                ],
                example: "Note: Great for displaying your store stock inventory price list directly on client WhatsApp chats."
            },
            festival: {
                title: "🎉 Festival Wishes & Daily Suvichar Help",
                steps: [
                    "Choose a holiday event, greeting, or daily suvichar frame background.",
                    "Enter your Name, upload your logo, and add your contact number.",
                    "Adjust font size, alignments, and text colors.",
                    "Click 'Download Image' to save the banner for WhatsApp Status branding."
                ],
                example: "Note: Excellent way to send daily branded morning suvichar images with your business logo."
            },
            parchi: {
                title: "🌾 Local Services & Daily Trade Parchi Help",
                steps: [
                    "Choose preset module (Atta Chakki Grinding, Dairy Milk collection, Tractor rent, or Job work).",
                    "Enter Customer name, date, and invoice serial number.",
                    "Fill in transaction values (Weights, rates, advances, balances).",
                    "Click 'Print Slip' to generate 3-inch thermal printer receipts or share PNG vouchers."
                ],
                example: "Note: Formatted to fit standard receipt formats including advances (Upad) and dues."
            },
            kankotri: {
                title: "💌 Wedding Invitation Cards Help",
                steps: [
                    "Select a traditional card theme (Red Patola, Royal Gold, Floral Rose).",
                    "Enter Groom & Bride names, parents, invitees details.",
                    "Fill in Muhurat timing, Venue address, and function schedule.",
                    "Click Export PDF to download print-ready wedding invitations."
                ],
                example: "Note: Standard layouts translate Gujarati wedding invitations cleanly into printable A4 formats."
            },
            rateboard: {
                title: "📊 Daily Mandi & Local Shop Rate Board Help",
                steps: [
                    "Select category presets (Mandi crop bhav, Grain prices, Milk fat chart, Chakki grinding prices).",
                    "Fill crop/item names and today's rates.",
                    "Choose background banner colors.",
                    "Click 'Download Rate Image' to save daily price list banners for social media."
                ],
                example: "Note: Update prices daily in 30 seconds to update clients on cotton, wheat, and feed rates."
            },
            resume: {
                title: "📄 Resume & CV Builder Help",
                steps: [
                    "Enter personal contact info, languages, and technical skills.",
                    "Add Professional Work Experience and Academic Education logs.",
                    "Select modern executive themes and colors.",
                    "Click 'Print / Export CV' to download print-ready resumes."
                ],
                example: "Note: Single-page resume outlines ensure standard corporate selection."
            },
            bill: {
                title: "🧾 Bill Book & Cash Memo Help",
                steps: [
                    "Enter Shop details (Name, Address, Phone, logo).",
                    "Enter client billing name and date.",
                    "Add products, quantities, rates, and discounts.",
                    "Click 'Print Cash Memo' to generate clean retail bills."
                ],
                example: "Note: Ideal for rapid daily retail calculations without GST complications."
            },
            cert: {
                title: "🏆 Certificate Maker Help",
                steps: [
                    "Choose certificate theme presets (Academic, Workshop, Sports, Excellence).",
                    "Enter Recipient Name, Achievements details, and Date.",
                    "Add organization title and upload signatures.",
                    "Print landscape A4 certifications."
                ],
                example: "Note: Preserves perfect certificate margins when printed on cardboard sheets."
            },
            letterhead: {
                title: "✉️ Letterhead Designer Help",
                steps: [
                    "Enter Company header info (Logo, Name, Contacts).",
                    "Compose letter body text with formatting editor options.",
                    "Choose design frames and borders.",
                    "Export to PDF or print directly."
                ],
                example: "Note: Print professional letters with header details instantly."
            },
            menu: {
                title: "🍴 Restaurant Menu Maker Help",
                steps: [
                    "Enter restaurant cafe name, contact, address.",
                    "Create menu item cards grouped under Category headers.",
                    "Specify item name, price, description, and Veg/Non-veg tags.",
                    "Download printable menu sheets."
                ],
                example: "Note: Perfect for print-ready restaurant tables or cafe counter displays."
            },
            label: {
                title: "🏷️ Price Tag & Barcode Label Help",
                steps: [
                    "Specify sticker columns and layout dimensions.",
                    "Input Item name, MRP, Sale price, Size, Batch, and Barcode data.",
                    "Select quantity duplicate copies.",
                    "Click Print to output onto adhesive sticker paper sheets."
                ],
                example: "Note: Ideal for garment shops, supermarkets, and barcode pricing labels."
            },
            idcard: {
                title: "🪪 Worker ID Badge Help",
                steps: [
                    "Enter employee name, ID card serial, department, blood group, valid date.",
                    "Upload passport profile photo.",
                    "Fill company name, details, and authorize signatures.",
                    "Print double-sided standard corporate badges."
                ],
                example: "Note: Sized exactly to fit credit-card size PVC card dimensions."
            },
            salary: {
                title: "💵 Salary Slip Generator Help",
                steps: [
                    "Enter Company details, employee details, and month/year.",
                    "Fill Earnings (Basic pay, HRA, allowances, OT).",
                    "Fill Deductions (PF, Professional tax, advances/upad).",
                    "Calculate net payable and print pay slips."
                ],
                example: "Note: Provides official monthly paycheck slips for office and factory workers."
            },
            tripsheet: {
                title: "🛣️ Vehicle Trip Sheet Help",
                steps: [
                    "Enter vehicle number, driver name, company client.",
                    "Log routes: starting KM meter, ending KM meter, dates.",
                    "Enter diesel expenses, tolls, allowances.",
                    "Calculate net kilometers and print rental trip vouchers."
                ],
                example: "Note: Ideal for transport, trucks, JCB, and rental car travels."
            },
            wa: {
                title: "💬 WhatsApp Direct Chat Help",
                steps: [
                    "Input target mobile phone number (with country code).",
                    "Type the pre-filled text message.",
                    "Click 'Send Message' to open chat without saving contacts."
                ],
                example: "Note: Send invoices/receipts directly to walk-in clients without saving numbers."
            },
            qr: {
                title: "🧬 Quick QR Code Maker Help",
                steps: [
                    "Select QR Data type (Text, URL link, WiFi, WhatsApp).",
                    "Enter values.",
                    "Select design colors and download QR code images."
                ],
                example: "Note: Paste printed QR code outside your store for client scans."
            }
        },
        gu: {
            interest: {
                title: "📈 વ્યાજ હિસાબ મદદ",
                steps: [
                    "મુદલ રકમ (લોન/ધિરાણ) દાખલ કરો.",
                    "વ્યાજનો દર (ટકાવારી) લખો.",
                    "વ્યાજનો પ્રકાર (માસિક ગામઠી વ્યાજ અથવા વાર્ષિક બેંક વ્યાજ) સિલેક્ટ કરો.",
                    "કુલ સમયગાળો (મહિના) લખો."
                ],
                example: "ઉદાહરણ: ₹૫૦,૦૦૦ ની મુદલ પર ૨ ટકા માસિક વ્યાજ દરથી ૧૨ મહિનાનું કુલ વ્યાજ ₹૧૨,૦૦૦ થાય (કુલ પરત ₹૬૨,૦૦૦)."
            },
            gst: {
                title: "🧾 જીએસટી ટેક્સ મદદ",
                steps: [
                    "મૂળ રકમ (ટેક્સ વગરની) દાખલ કરો.",
                    "જીએસટી ટેક્સ દર સિલેક્ટ કરો (૫%, ૧૨%, ૧૮%, ૨૮%).",
                    "ક્રિયા પસંદ કરો: ટેક્સ ઉમેરવો (Add GST) કે ટેક્સ બાદ કરવો (Remove GST)."
                ],
                example: "ઉદાહરણ: ₹૧૦,૦૦૦ પર ૧૮% 'Add GST' કરવાથી ₹૧,૮૦૦ ટેક્સ અને કુલ ₹૧૧,૮૦૦ થશે."
            },
            crop_bag: {
                title: "🌾 ખેતી પાક ગુણી હિસાબ મદદ",
                steps: [
                    "કુલ ગુણી / કોથળાની સંખ્યા લખો.",
                    "કોથળાનું સરેરાશ વજન (કિલો) લખો.",
                    "બારદાન કટ (ખાલી કોથળાનું વજન) બાદ કરવા માટે લખો (કિલો/કોથળો).",
                    "ભાવ દર લખો અને ભાવ ગણતરી પ્રકાર (મણ દીઠ / કિલો દીઠ / ક્વિન્ટલ દીઠ) નક્કી કરો."
                ],
                example: "ઉદાહરણ: ૫૦ કોથળા ૪૦કિલો સરેરાશ વજન (૦.૫ કિલો બારદાન બાદ) અને ₹૧૩૦૦ પ્રતિ મણ ના ભાવે કુલ ₹૧,૨૮,૩૭૫ મળશે."
            },
            ad: {
                title: "🎴 વિઝિટિંગ કાર્ડ પ્રો મદદ",
                steps: [
                    "કંપનીનું નામ, વ્યવસાયિક હોદ્દો, ફોન નંબર, સરનામું અને વેબસાઈટ વિગતો ભરો.",
                    "દુકાનનો લોગો અપલોડ કરો અથવા સેટ કરેલ ચિહ્નો વાપરો.",
                    "તમારો મનપસંદ થીમ કલર સિલેક્ટ કરો.",
                    "નજીકની પ્રિન્ટિંગ પ્રેસમાં છપાવવા માટે 'Print Card' પર ક્લિક કરો."
                ],
                example: "ઉદાહરણ: પ્રિન્ટ કરવાથી એક જ A4 પેજ પર ૧૦ વિઝિટિંગ કાર્ડ લાઇનસર ગોઠવાઈને તૈયાર થશે!"
            },
            vcard: {
                title: "🎀 ડિજિટલ vCard ક્રાફ્ટર મદદ",
                steps: [
                    "વ્યવસાયના માલિકનું નામ, સોશિયલ મીડિયા લિંક્સ (વોટ્સએપ, ફેસબુક, ઇન્સ્ટાગ્રામ) ભરો.",
                    "તમારા ગ્રાહકો માટે સીધા કોલ અને નકશા (Location) ના કસ્ટમ બટન ઉમેરો.",
                    "આકર્ષક બેકગ્રાઉન્ડ ડિઝાઇન પસંદ કરો.",
                    "તમારી વિગતો સીધી મોબાઈલ ફોનબુકમાં સેવ કરાવવા 'Download VCF' બટન દબાવો."
                ],
                example: "ઉદાહરણ: આ ઓનલાઇન વિઝિટિંગ કાર્ડની લિંક શેર કરવાથી ગ્રાહક સીધા જ તમારા બટન પર ક્લિક કરી મેપ કે વોટ્સએપ પર જઈ શકશે."
            },
            catalog: {
                title: "🛍️ પ્રોડક્ટ કેટેલોગ અને બ્રોશર મદદ",
                steps: [
                    "તમારી દુકાન/વેપારનું નામ, હેડિંગ અને ફોન વિગતો લખો.",
                    "પ્રોડક્ટ્સ ઉમેરો: ફોટો અપલોડ કરો, નામ લખો, કિંમત અને વર્ણન દાખલ કરો.",
                    "અલગ-અલગ કેટેગરી વાઈઝ સામાન ગોઠવો.",
                    "PDF ડાઉનલોડ કરવા માટે 'Print Catalog' પર ક્લિક કરો."
                ],
                example: "ઉદાહરણ: ગ્રાહકને સામાનના ફોટા અને કિંમત સાથે આખી યાદી વોટ્સએપ પર મોકલવા માટે આ શ્રેષ્ઠ છે."
            },
            festival: {
                title: "🎉 તહેવાર અને દૈનિક સુવિચાર ફ્રેમ મદદ",
                steps: [
                    "તહેવાર અથવા દૈનિક સુવિચાર/શુભેચ્છાની ફ્રેમ પસંદ કરો.",
                    "તમારું કે બિઝનેસનું નામ, લોગો અને મોબાઈલ નંબર સેટ કરો.",
                    "નામના કલર અને ફોન્ટ સાઈઝ જરૂર મુજબ એડજસ્ટ કરો.",
                    "મોબાઈલ ગેલેરીમાં સેવ કરવા 'Download Image' પર ક્લિક કરી વોટ્સએપ સ્ટેટ્સ સેટ કરો."
                ],
                example: "ઉદાહરણ: રોજ સવારે ગ્રાહકોને શુભ પ્રભાત મોકલવા માટે તમારા લોગો વાળી જાહેરાત ફ્રેમ બનાવો."
            },
            parchi: {
                title: "🌾 સ્થાનિક વ્યવસાય પહોંચ મદદ",
                steps: [
                    "સેવા પસંદ કરો (લોટ પીસાઈ/ઘંટી રસીદ, દૂધ મંડળી કલેક્શન, ટ્રેક્ટર ભાડું અથવા સામાન્ય રિપેરિંગ પહોંચ).",
                    "ગ્રાહકનું નામ અને બિલ નંબર દાખલ કરો.",
                    "વજન, ભાવ અને બાકી રકમ (ઉપાડ/જમા) ની વિગતો ભરો.",
                    "ગ્રાહકને પહોંચ આપવા 'Print Slip' દબાવો અથવા વોટ્સએપ પર સેન્ડ કરો."
                ],
                example: "ઉદાહરણ: ૩-ઈંચ થર્મલ પ્રિન્ટર સાઈઝ લેઆઉટ હોવાથી નાના બિલ પ્રિન્ટર પર પણ સેટ થશે."
            },
            rateboard: {
                title: "📊 દૈનિક મંડી અને દુકાન ભાવપત્રક મદદ",
                steps: [
                    "બોર્ડ પ્રકાર પસંદ કરો (મંડી બજાર ભાવ, અનાજ ભાવ પત્રક, દૂધ ડેરી ફેટ ચાર્ટ, લોટ પીસાઈ ભાવપત્રક).",
                    "અલગ-અલગ પાક કે સામાનના નામ અને આજના તાજા ભાવો લખો.",
                    "તમારી પસંદગી મુજબ બેકગ્રાઉન્ડ કલર સેટ કરો.",
                    "મોબાઈલમાં સેવ કરીને વોટ્સએપ સ્ટેટ્સ સેટ કરવા 'Download Rate Image' દબાવો."
                ],
                example: "ઉદાહરણ: દરરોજ સવારે મગફળી, કપાસ અને ઘઉંના આજના બજાર ભાવો ગ્રાહક સુધી પહોંચાડવા માટે બેસ્ટ બોર્ડ."
            },
            bill: {
                title: "🧾 બિલ બુક અને રોકડી રસીદ મદદ",
                steps: [
                    "દુકાનનું નામ, ફોન અને બિલ બુક નંબર લખો.",
                    "ગ્રાહકની સામાન્ય વિગત (નામ, મોબાઈલ) દાખલ કરો.",
                    "ખરીદેલ સામાનની લિસ્ટ ભરો: સામાનનું નામ, નંગ અને કિંમત લખો.",
                    "રોકડા બિલની પહોંચ આપવા 'Print Cash Memo' દબાવો."
                ],
                example: "ઉદાહરણ: સામાન્ય કરિયાણા, મોબાઇલ રિપેરિંગ કે અન્ય રીટેલ બિલિંગ માટે વગર જીએસટીએ સ્પીડમાં બિલ આપવા બેસ્ટ."
            },
            salary: {
                title: "💵 માસિક સ્ટાફ પગાર પત્રક મદદ",
                steps: [
                    "કંપનીનું નામ, કર્મચારીનું નામ, પદોન્નતિ અને પગારનો મહિનો લખો.",
                    "કુલ આવક (મૂળ પગાર/Basic, ભથ્થું/HRA, ઓવરટાઇમ) દાખલ કરો.",
                    "કપાત રકમ (પી.એફ, વ્યવસાય વેરો, લીધેલ એડવાન્સ/ઉપાડ) લખો.",
                    "કુલ ચોખ્ખો પગાર (Net Pay) ગણીને કર્મચારીને આપવા પહોંચ પ્રિન્ટ કરો."
                ],
                example: "ઉદાહરણ: ફેક્ટરી, દુકાન કે ઓફિસના સ્ટાફને માસિક પગારની રસીદ કાગળ આપવા માટે ઉપયોગી."
            },
            tripsheet: {
                title: "🛣️ ટ્રીપ શીટ વાહન લોગ બુક મદદ",
                steps: [
                    "ગાડી/વાહન નંબર, ડ્રાઈવરનું નામ અને કંપની વિગત ભરો.",
                    "રૂટ લોગ લખો: મુસાફરી શરુઆત કિલોમીટર મીટર, અંતિમ કિલોમીટર મીટર, તારીખ અને રૂટ.",
                    "ડિઝલ પુરાવ્યાનો ખર્ચ, રોકડ ટોલ ટેક્સ અને ડ્રાઈવર ભથ્થું ખર્ચ લખો.",
                    "முસાફરી ભાડાનું બિલ પ્રિન્ટ કરવા 'Print Trip Sheet' દબાવો."
                ],
                example: "ઉદાહરણ: કાર, ટ્રક કે જેસીબી ના ભાડાના કિલોમીટર મીટર અને ખર્ચના હિસાબ માટે પહોંચ."
            }
        }
    };

    const estimateHelpData = {
        en: {
            title: "🧾 GST Invoice & Estimate Maker Help",
            steps: [
                "Enter your Shop/Company details at the left panel (Name, Address, Phone, GSTIN).",
                "Fill in Client details (Client Name, Phone, Address, GSTIN).",
                "Add items to the list: enter Item Name, Qty, Price, and GST tax percentage.",
                "Choose a gorgeous theme (Corporate Blue, Luxury Dark, Emerald, Purple).",
                "Click 'Print / PDF' to save the standard A4 printable PDF invoice."
            ],
            example: "Note: Real-time calculation auto-computes CGST (50%), SGST (50%), flat discount, and final net payable sums."
        },
        gu: {
            title: "🧾 જીએસટી બિલ અને ક્વોટેશન મદદ",
            steps: [
                "ડાબી બાજુ પેનલ પર તમારી દુકાન/કંપનીની વિગતો લખો (નામ, સરનામું, ફોન, GSTIN).",
                "ગ્રાહક (Client) ની વિગતો દાખલ કરો (નામ, ફોન, સરનામું).",
                "આઈટમ લિસ્ટ ઉમેરો: સામાનનું નામ, નંગ/જથ્થો, કિંમત અને GST ટકાવારી લખો.",
                "તમારો મનપસંદ કલર થીમ સિલેક્ટ કરો (કોર્પોરેટ બ્લુ, લક્ઝરી બ્લેક, ગ્રીન, પર્પલ).",
                "બિલ ડાઉનલોડ કરવા માટે 'Print / PDF Invoice' પર ક્લિક કરી PDF સેવ કરો."
            ],
            example: "નોંધ: એપ્લિકેશન આપમેળે CGST (૫૦%), SGST (૫૦%), ડિસ્કાઉન્ટ બાદ કરીને કુલ ચોખ્ખી રકમ ગણી આપે છે."
        }
    };

    const defaultHelpData = {
        en: {
            title: "🚀 Welcome to Digital Tools Hub Guide",
            steps: [
                "Select a business module from the grid below (e.g. GST Billing, Services & Utilities, Finance Calculators, or Digital Cards).",
                "Fill in details in the form inputs on the left side of the page. Values and formulas compute automatically.",
                "Instantly download the slip or invoice as PDF or PNG, and share directly to clients via WhatsApp!"
            ],
            example: "Summary: A unified suite of 20+ free utility tools designed for shopkeepers, traders, farmers, and daily businesses."
        },
        gu: {
            title: "🚀 ડિજિટલ ટૂલ્સ હબ માર્ગદર્શિકા",
            steps: [
                "નીચે આપેલા લિસ્ટમાંથી ગમે તે સાધન પસંદ કરો (જેમ કે GST બિલ બુક, સ્થાનિક અને દૈનિક સેવાઓ, વ્યાજ કેલ્ક્યુલેટર, કે વિઝિટિંગ કાર્ડ).",
                "સિલેક્ટ કરેલા ફોર્મમાં જરૂરી વિગતો અને આંકડા લખો. ગણતરી આપમેળે થઈને રસીદ તૈયાર થશે.",
                "તૈયાર થયેલ બિલ કે પહોંચને ૧ જ ક્લિકમાં PDF/PNG તરીકે ડાઉનલોડ કરો અથવા ગ્રાહકને વોટ્સએપ પર મોકલો!"
            ],
            example: "પોર્ટલ પરિચય: દુકાનદારો, વેપારીઓ, ખેડૂતો અને દૈનિક હિસાબ માટે ૨૦+ ઉપયોગી સાધનોનો સંગ્રહ."
        }
    };

    // Inject modal HTML dynamically
    function injectModal() {
        const modal = document.createElement("div");
        modal.id = "help-modal";
        modal.className = "modal-overlay";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; align-items:center; justify-content:center; padding:15px; backdrop-filter:blur(5px);";
        modal.innerHTML = `
            <div class="modal-card" style="background:#1e293b; border:1px solid #475569; color:#f8fafc; border-radius:14px; max-width:520px; width:100%; padding:25px; box-shadow:0 25px 50px rgba(0,0,0,0.6); position:relative; font-family:'Inter', sans-serif;">
                <button onclick="closeHelpModal()" style="position:absolute; top:15px; right:15px; background:none; border:none; color:#94a3b8; font-size:22px; cursor:pointer;"><i class="fas fa-times"></i></button>
                <div id="help-modal-content"></div>
                <div style="display:flex; justify-content:space-between; margin-top:25px; gap:10px;">
                    <button id="help-btn-demo" onclick="runHelpDemo()" style="background:#0284c7; color:#fff; border:none; padding:10px 18px; border-radius:8px; font-weight:bold; cursor:pointer; flex: 1;"><i class="fas fa-play"></i> Run Demo / ઉદાહરણ જુઓ</button>
                    <button onclick="closeHelpModal()" style="background:#334155; color:#f8fafc; border:none; padding:10px 18px; border-radius:8px; font-weight:bold; cursor:pointer; flex: 1;">Close / બંધ કરો</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Toggle Modal
    window.toggleHelpModal = function () {
        const modal = document.getElementById("help-modal");
        if (modal) {
            modal.style.display = "flex";
            renderHelpContent();
        }
    };

    window.closeHelpModal = function () {
        const modal = document.getElementById("help-modal");
        if (modal) modal.style.display = "none";
    };

    function renderHelpContent() {
        const lang = typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en';
        const isCalc = window.location.pathname.includes("calculator.html");
        const isEst = window.location.pathname.includes("estimate.html");
        const isIndex = document.querySelector(".cat-pills") !== null;

        // Parse page name from URL
        const pageName = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

        let data = null;
        if (isIndex) {
            data = defaultHelpData[lang] || defaultHelpData['en'];
        } else if (isCalc) {
            const engine = typeof currentEngine !== "undefined" ? currentEngine : "interest";
            data = (helpDataMap[lang] && helpDataMap[lang][engine]) ? helpDataMap[lang][engine] : (helpDataMap['en'][engine] || null);
        } else if (isEst) {
            data = estimateHelpData[lang] || estimateHelpData['en'];
        } else {
            // Find custom tool specific help or fallback
            data = (helpDataMap[lang] && helpDataMap[lang][pageName]) ? helpDataMap[lang][pageName] : (helpDataMap['en'][pageName] || null);
        }

        if (!data) {
            data = defaultHelpData[lang] || defaultHelpData['en'];
        }

        const toolNameEl = document.querySelector('.header-tool-name');
        const toolTitleText = data.title || (toolNameEl ? toolNameEl.textContent.trim() : "Digital Tool");

        let stepsHtml = '';
        data.steps.forEach((step, idx) => {
            stepsHtml += `<li style="margin-bottom:10px; font-size:14px; line-height:1.5; display:flex; align-items:flex-start;"><span style="background:#f59e0b; color:#000; border-radius:50%; min-width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; margin-right:10px; margin-top:2px;">${idx + 1}</span><span style="color:#e2e8f0;">${step}</span></li>`;
        });

        // Hide run demo button on index page
        const demoBtn = document.getElementById("help-btn-demo");
        if (demoBtn) {
            demoBtn.style.display = isIndex ? "none" : "block";
        }

        const content = document.getElementById('help-modal-content');
        content.innerHTML = `
            <h3 style="margin-top:0; color:#f59e0b; font-size:18px; font-weight:800; border-bottom:1px solid #334155; padding-bottom:10px; margin-bottom:15px;"><i class="fas fa-compass"></i> ${toolTitleText}</h3>
            <ul style="list-style:none; padding-left:0; margin-bottom:15px; max-height:220px; overflow-y:auto; padding-right:5px;">
                ${stepsHtml}
            </ul>
            <div style="background:#0f172a; border-left:4px solid #f59e0b; padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; line-height:1.4; font-style:italic;">
                ${data.example}
            </div>
        `;
    }

    window.runHelpDemo = function () {
        window.closeHelpModal();
        const isCalc = window.location.pathname.includes("calculator.html");
        const isEst = window.location.pathname.includes("estimate.html");

        if (isCalc) {
            const engine = typeof currentEngine !== "undefined" ? currentEngine : "interest";
            if (engine === 'interest') {
                document.getElementById('int-p').value = 75000;
                document.getElementById('int-r').value = 2.5;
                document.getElementById('int-t').value = 10;
            } else if (engine === 'gst') {
                document.getElementById('gst-amt').value = 25000;
            } else if (engine === 'crop_bag') {
                document.getElementById('crop-bags').value = 80;
                document.getElementById('crop-bag-wt').value = 42.5;
                document.getElementById('crop-bardano').value = 0.6;
                document.getElementById('crop-rate').value = 1450;
            }
            if (typeof renderParchi === "function") renderParchi();
            if (typeof showToast === "function") showToast("Calculator demo data loaded!");
            return;
        }

        if (isEst) {
            document.getElementById('in-shop-name').value = "Royal Kirana & General Store";
            document.getElementById('in-shop-sub').value = "Quality grains and daily goods";
            document.getElementById('in-shop-addr').value = "Opp. Bus Station, Gondal, Gujarat";
            document.getElementById('in-shop-phone').value = "+91 99988 77766";
            document.getElementById('in-shop-gstin').value = "24ABCDE1234F1Z9";

            document.getElementById('in-client-name').value = "Ramesh Kumar Keshwala";
            document.getElementById('in-client-phone').value = "+91 98980 12345";

            if (typeof app !== "undefined") {
                app.items = [
                    { name: "Premium Basmati Rice", qty: 2, price: 95.0, tax: 5 },
                    { name: "Refined Groundnut Oil (15L)", qty: 1, price: 2850.0, tax: 12 },
                    { name: "Organic Jaggery (Gur)", qty: 5, price: 65.0, tax: 0 }
                ];
            }
            if (typeof renderItemsList === "function") renderItemsList();
            if (typeof render === "function") render();
            if (typeof showToast === "function") showToast("Invoice demo data loaded!");
            return;
        }

        // Generic demo loader
        const inputs = document.querySelectorAll(".controls-panel input, .editor-panel input, .form-panel input, .settings-panel input");
        inputs.forEach(input => {
            if (input.value === "" || input.value === "0") {
                if (input.type === "number") {
                    input.value = "150";
                } else if (input.type === "text") {
                    input.value = "Demo Sample Value";
                }
                input.dispatchEvent(new Event("input"));
                input.dispatchEvent(new Event("change"));
            }
        });
        if (typeof render === "function") render();
        if (typeof updatePreview === "function") updatePreview();
        if (typeof showToast === "function") showToast("Demo data loaded!");
    };

    window.shareIndexPage = function (event) {
        if (event) event.preventDefault();
        const lang = typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en';
        const shareDomain = window.APP_SHARE_DOMAIN || window.location.origin;
        const targetUrl = shareDomain + '/index.html';

        let msg = "";
        if (lang === 'gu') {
            msg = `🚀 *ડિજિટલ ટૂલ્સ હબ (Digital Tools Hub)* 🚀\n\nવેપારીઓ અને ગ્રાહકો માટે ઉપયોગી ૨૦+ થી વધુ સાધનો:\n\n🔹 જીએસટી બિલ અને ક્વોટેશન\n🔹 વ્યાજ ગણતરી (માસિક/વાર્ષિક)\n🔹 ખેતી પાક ગુણી અને દૂધ ફેટ બિલ\n🔹 ટ્રેક્ટર ભાડું અને પીસાઈ રસીદ\n🔹 વિઝિટિંગ કાર્ડ અને લગ્ન કંકોત્રી\n\nગ્રાહકો સાથે ગણતરીની રસીદ (Parchi) વોટ્સએપ પર ૧ મિનિટમાં શેર કરો.\n\n👉 *મોબાઈલ એપ્લિકેશન શરૂ કરવા નીચે ક્લિક કરો:*\n​${targetUrl}`;
        } else if (lang === 'hi') {
            msg = `🚀 *डिजिटल टूल्स हब (Digital Tools Hub)* 🚀\n\nव्यापारियों और ग्राहकों के लिए उपयोगी २०+ से अधिक टूल्स:\n\n🔹 जीएसटी बिल और कोटेशन\n🔹 ब्याज गणना (मासिक/वार्षिक)\n🔹 फसल बोरी और दूध फैट रसीद\n🔹 ट्रैक्टर किराया और पिसाई रसीद\n🔹 विजिटिंग कार्ड और शादी पत्रिका\n\nग्राहकों के साथ गणना रसीद (Parchi) व्हाट्सएप पर १ मिनट में शेयर करें।\n\n👉 *मोबाइल एप्लिकेशन शुरू करने के लिए नीचे क्लिक करें:*\n​${targetUrl}`;
        } else {
            msg = `🚀 *Digital Tools Hub* 🚀\n\n20+ Powerful Daily Business & Utility Tools:\n\n🔹 GST Invoice & Estimate Maker\n🔹 Simple & Monthly Interest Calculator\n🔹 APMC Crop Bag Yield Calculator\n🔹 Milk Dairy FAT Payout & Tractor Rental\n🔹 Business Visiting Cards & Wedding Invitations\n\nPerform calculations and share professional PDFs/slips on WhatsApp instantly!\n\n👉 *Click here to open application:*\n​${targetUrl}`;
        }

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    window.shareOnWhatsApp = function () {
        const lang = typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en';
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        const shareDomain = window.APP_SHARE_DOMAIN || window.location.origin;
        const targetUrl = shareDomain + '/' + pageName;

        const toolNameEl = document.querySelector('.header-tool-name');
        const toolTitleText = toolNameEl ? toolNameEl.textContent.trim() : "Digital Tool";

        let msg = "";
        if (lang === 'gu') {
            msg = `📊 *${toolTitleText}* 📊\n\nઆ ઉપયોગી ડિજિટલ સાધનની મદદથી ૧ મિનિટમાં ફાઇલ બનાવો અને ડાઉનલોડ કરો!\n\n👉 *સાધન વાપરવા માટે નીચેની લિંક પર ક્લિક કરો:*\n${targetUrl}`;
        } else if (lang === 'hi') {
            msg = `📊 *${toolTitleText}* 📊\n\nइस उपयोगी डिजिटल टूल की मदद से १ मिनट में फाइल बनाएं और डाउनलोड करें!\n\n👉 *टूल का उपयोग करने के लिए नीचे दिए गए लिंक पर क्लिक करें:*\n${targetUrl}`;
        } else {
            msg = `📊 *${toolTitleText}* 📊\n\nGenerate professional files and download them in 1 minute!\n\n👉 *Click here to open tool:*\n${targetUrl}`;
        }

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    // Inject buttons on DOM Load
    function setupHeaderButtons() {
        const headerActions = document.querySelector(".header-actions") || document.querySelector(".nav-actions");
        if (headerActions && !headerActions.querySelector(".btn-help-global")) {
            const lang = typeof getSavedLanguage === 'function' ? getSavedLanguage() : 'en';
            let helpText = "Help";
            if (lang === 'gu') helpText = "કેવી રીતે વાપરવું?";
            else if (lang === 'hi') helpText = "कैसे उपयोग करें?";

            const isIndex = document.querySelector(".nav-actions") !== null || document.querySelector(".cat-pills") !== null;

            const helpBtn = document.createElement("button");
            if (isIndex) {
                helpBtn.className = "theme-btn btn-help-global";
                helpBtn.style.cssText = "cursor: pointer; margin-right: 8px;";
            } else {
                helpBtn.className = "btn-top btn-help-global";
                helpBtn.style.cssText = "margin-right: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; font-size: 13px; font-weight: bold; border-radius: 6px; border: 1px solid #475569; background: #334155; color: #f8fafc;";
            }
            helpBtn.innerHTML = '<i class="fas fa-question-circle"></i> ' + helpText;
            helpBtn.onclick = window.toggleHelpModal;

            if (!isIndex) {
                const shareBtn = document.createElement("button");
                shareBtn.className = "btn-top btn-share-global";
                shareBtn.style.cssText = "margin-right: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; font-size: 13px; font-weight: bold; border-radius: 6px; border: 1px solid #16a34a; background: #16a34a; color: #fff;";

                let shareText = "Share Tool Link";
                if (lang === 'gu') shareText = "ટૂલ લિંક મોકલો";
                else if (lang === 'hi') shareText = "टૂલ  ભેજે";

                shareBtn.innerHTML = '<i class="fab fa-whatsapp"></i> ' + shareText;
                shareBtn.onclick = window.shareOnWhatsApp;

                const firstButton = headerActions.querySelector("button, div");
                if (firstButton) {
                    headerActions.insertBefore(helpBtn, firstButton);
                    headerActions.insertBefore(shareBtn, helpBtn);
                } else {
                    headerActions.appendChild(shareBtn);
                    headerActions.appendChild(helpBtn);
                }
            } else {
                // On index page, insert Help button next to the Theme/Moon button
                const themeBtn = headerActions.querySelector(".theme-btn");
                if (themeBtn) {
                    headerActions.insertBefore(helpBtn, themeBtn);
                } else {
                    headerActions.appendChild(helpBtn);
                }
            }
        }
    }

    // Set visited flag when help modal is closed
    const origCloseHelpModal = window.closeHelpModal;
    window.closeHelpModal = function () {
        if (origCloseHelpModal) origCloseHelpModal();
        localStorage.setItem("has_visited_before", "true");
    };

    // Early AdSense script load if enabled
    if (window.ENABLE_ADSENSE && window.ADSENSE_PUB_ID && window.ADSENSE_PUB_ID.includes("pub-")) {
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${window.ADSENSE_PUB_ID}`;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
    }

    // Dynamic AdSense Layout Injection
    function setupAdsenseLayout() {
        if (!window.ENABLE_ADSENSE || !window.ADSENSE_PUB_ID || !window.ADSENSE_PUB_ID.includes("pub-")) {
            return;
        }

        const isIndex = document.querySelector(".nav-actions") !== null || document.querySelector(".cat-pills") !== null;

        if (isIndex) {
            // 1. Banner below the category pills (.cat-pills)
            const catPills = document.querySelector(".cat-pills");
            if (catPills && !document.querySelector(".adsense-index-top")) {
                const adContainer = document.createElement("div");
                adContainer.className = "adsense-index-top";
                adContainer.style.cssText = "margin: 20px auto; max-width: 1200px; padding: 0 15px; text-align: center;";
                adContainer.innerHTML = `
                    <div style="font-size: 10px; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Advertisement / જાહેરાત</div>
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="${window.ADSENSE_PUB_ID}"
                         data-ad-slot="auto"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                `;
                catPills.parentNode.insertBefore(adContainer, catPills.nextSibling);
                try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
            }

            // 2. Banner at the bottom of the dashboard page
            const mainContainer = document.querySelector(".container") || document.body;
            if (mainContainer && !document.querySelector(".adsense-index-bottom")) {
                const adContainer = document.createElement("div");
                adContainer.className = "adsense-index-bottom";
                adContainer.style.cssText = "margin: 30px auto; max-width: 1200px; padding: 0 15px; text-align: center;";
                adContainer.innerHTML = `
                    <div style="font-size: 10px; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Advertisement / જાહેરાત</div>
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="${window.ADSENSE_PUB_ID}"
                         data-ad-slot="auto"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                `;
                mainContainer.appendChild(adContainer);
                try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
            }
        } else {
            // Append ad unit at the bottom of the left panels
            const panel = document.querySelector(".controls-panel") || document.querySelector(".editor-panel") || document.querySelector(".form-panel") || document.querySelector(".settings-panel");
            if (panel && !document.querySelector(".adsense-tool-panel")) {
                const adContainer = document.createElement("div");
                adContainer.className = "adsense-tool-panel";
                adContainer.style.cssText = "margin-top: 25px; padding: 15px; border-top: 1px solid #334155; text-align: center;";
                adContainer.innerHTML = `
                    <div style="font-size: 10px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Advertisement / જાહેરાત</div>
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-client="${window.ADSENSE_PUB_ID}"
                         data-ad-slot="auto"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                `;
                panel.appendChild(adContainer);
                try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
            }
        }
    }

    // First time automatic welcome popup (evaluated on DOM ready)
    document.addEventListener("DOMContentLoaded", () => {
        const isIndexPage = document.querySelector(".nav-actions") !== null || document.querySelector(".cat-pills") !== null;
        if (isIndexPage && !localStorage.getItem("has_visited_before")) {
            setTimeout(() => {
                window.toggleHelpModal();
            }, 1200);
        }
    });

    // Centralized helpline dynamic updater
    function setupHelplineLinks() {
        const phone = window.SUPPORT_PHONE || "919998877766";
        const creatorName = window.CREATOR_NAME || "Raju Jatapara";

        // Update all support whatsapp links & telephone links dynamically
        document.querySelectorAll("a").forEach(link => {
            let href = link.getAttribute("href") || "";

            if (href.includes("wa.me/")) {
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                link.href = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(creatorName)},%20I%20need%20help%20with%20Digital%20Tools%20Hub!`;
            }

            if (href.startsWith("tel:")) {
                const cleanPhone = phone.replace(/[^0-9]/g, "");
                link.href = `tel:+${cleanPhone}`;
            }
        });

        // Update footer credits dynamically
        const footer = document.querySelector(".footer");
        if (footer) {
            footer.innerHTML = footer.innerHTML.replace(/Raju Jatapara/g, creatorName);
        }

        // Update creator details in about.html text dynamically
        const card = document.querySelector(".card");
        if (card && window.location.pathname.includes("about.html")) {
            card.innerHTML = card.innerHTML.replace(/Raju Jatapara/g, creatorName);
        }
    }

    // Dynamic PWA registration & Custom Install Prompt
    let deferredPrompt;

    function setupPWA() {
        // 1. Inject Manifest link tag
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = 'manifest.json';
            document.head.appendChild(link);
        }

        // Inject Favicon dynamically
        if (!document.querySelector('link[rel="icon"]')) {
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/png';
            favicon.href = 'assets/img/icon-192.png';
            document.head.appendChild(favicon);
        }

        // 2. Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('PWA ServiceWorker registered successfully: ', reg.scope))
                .catch(err => console.log('PWA ServiceWorker registration failed: ', err));
        }

        // 3. Custom Install Prompt Listener
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBanner = document.getElementById('pwa-install-banner');
            if (installBanner) {
                installBanner.style.display = 'block';
            }
        });

        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.addEventListener('click', () => {
                if (deferredPrompt) {
                    // Update button state to "Installing..." with spinner
                    installBtn.disabled = true;
                    const lang = getSavedLanguage();
                    let loadingText = "Installing...";
                    if (lang === 'gu') loadingText = "સેટ થઈ રહ્યું છે...";
                    else if (lang === 'hi') loadingText = "इंस्टॉल हो रहा है...";
                    
                    installBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
                    
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the PWA install prompt');
                        } else {
                            // Reset button if dismissed
                            installBtn.disabled = false;
                            installBtn.innerHTML = "Install / સેટ કરો";
                        }
                        deferredPrompt = null;
                    });
                }
            });
        }

        window.addEventListener('appinstalled', () => {
            console.log('PWA app installation queued in OS background');
            const installBanner = document.getElementById('pwa-install-banner');
            if (installBanner) installBanner.style.display = 'none';
            
            // Show dynamic background installation status alert toast
            const lang = getSavedLanguage();
            let successMsg = "📲 App installing in background! Check notification bar for progress.";
            if (lang === 'gu') successMsg = "📲 મોબાઇલ એપ બેકગ્રાઉન્ડમાં ઇન્સ્ટોલ થઈ રહી છે! નોટિફિકેશન બાર ચેક કરો.";
            else if (lang === 'hi') successMsg = "📲 मोबाइल ऐप बैकग्राउंड में इंस्टॉल हो रहा है! नोटिफिकेशन बार चेक करें.";
            
            showGlobalPwaToast(successMsg);
        });

        function showGlobalPwaToast(msg, isOffline = false) {
            // Remove existing PWA toasts to avoid overlay stacking
            document.querySelectorAll('.pwa-global-toast').forEach(el => el.remove());

            const toast = document.createElement('div');
            toast.className = 'pwa-global-toast';
            toast.style.position = 'fixed';
            toast.style.bottom = '85px';
            toast.style.left = '50%';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            toast.style.background = '#1e293b';
            toast.style.color = isOffline ? '#fca5a5' : '#fbbf24';
            toast.style.border = isOffline ? '1px solid #ef4444' : '1px solid #10b981';
            toast.style.padding = '12px 24px';
            toast.style.borderRadius = '30px';
            toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
            toast.style.zIndex = '99999';
            toast.style.fontSize = '12px';
            toast.style.fontWeight = '700';
            toast.style.textAlign = 'center';
            toast.style.pointerEvents = 'none';
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.gap = '8px';
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            toast.innerText = msg;
            document.body.appendChild(toast);
            
            // Trigger animation frame for transition entry
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) translateY(0)';
            });
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(10px)';
                setTimeout(() => toast.remove(), 400);
            }, 3500);
        }

        // Live connection monitoring helper
        function setupOfflineStatusTracker() {
            window.addEventListener('offline', () => {
                showGlobalPwaToast(getOfflineMessage(), true);
            });

            window.addEventListener('online', () => {
                showGlobalPwaToast(getOnlineMessage(), false);
            });
        }

        function getOfflineMessage() {
            const lang = getSavedLanguage();
            if (lang === 'gu') return "⚠️ તમે ઑફલાઇન છો, પણ સાધનો ચાલુ છે!";
            if (lang === 'hi') return "⚠️ आप ऑफलाइन हैं, लेकिन टूल्स चालू हैं!";
            return "⚠️ You are offline, but tools are working!";
        }

        function getOnlineMessage() {
            const lang = getSavedLanguage();
            if (lang === 'gu') return "🟢 તમે હવે ઓનલાઈન છો!";
            if (lang === 'hi') return "🟢 आप अब ऑनलाइन हैं!";
            return "🟢 You are back online!";
        }

        // Initialize status tracker
        setupOfflineStatusTracker();
    }

    // Global Web Share API helper for files (PDF, Images, etc.)
    window.shareGeneratedFile = function(blob, filename, mimeType) {
        if (!blob) {
            console.error("No file blob provided for sharing.");
            return;
        }

        const file = new File([blob], filename, { type: mimeType });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: 'Digital Tools Hub Document',
                text: 'Here is your generated slip/document.'
            })
            .then(() => console.log('File shared successfully!'))
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing file:', err);
                    triggerFallbackDownload(blob, filename);
                }
            });
        } else {
            console.log('Web Share API not supported or file type not shareable. Triggering download.');
            triggerFallbackDownload(blob, filename);
            showShareToast();
        }
    };

    function triggerFallbackDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showShareToast() {
        const toast = document.createElement('div');
        toast.className = 'share-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '80px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#1e293b';
        toast.style.color = '#fbbf24';
        toast.style.border = '1px solid #334155';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '30px';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        toast.style.zIndex = '99999';
        toast.style.fontSize = '12px';
        toast.style.fontWeight = '700';
        toast.style.textAlign = 'center';
        toast.style.pointerEvents = 'none';
        
        const lang = getSavedLanguage();
        let msg = "Document Downloaded! You can now share it manually on WhatsApp.";
        if (lang === 'gu') {
            msg = "દસ્તાવેજ ડાઉનલોડ થયો! હવે તમે તેને વોટ્સએપ પર મોકલી શકો છો.";
        } else if (lang === 'hi') {
            msg = "दस्तावेज़ डाउनलोड हो गया! अब आप इसे व्हाट्सएप पर भेज सकते हैं.";
        }
        
        toast.innerText = msg;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s ease';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            injectModal();
            setupHeaderButtons();
            setupAdsenseLayout();
            setupHelplineLinks();
            setupPWA();
        });
    } else {
        injectModal();
        setupHeaderButtons();
        setupAdsenseLayout();
        setupHelplineLinks();
        setupPWA();
    }
})();

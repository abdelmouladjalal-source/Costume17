let AVAILABLE_COLORS = [];
// استخدام ID فريد لتتبع كل عملية تأجير بدلاً من الـ index
let rentals = JSON.parse(localStorage.getItem("rentals")) || []; 

let pants, gilets, vests, shirts, belts, shoes, ties, bows, broches;

// تعيين تاريخ اليوم كتاريخ تأجير افتراضي عند تحميل الصفحة
if (document.getElementById("rentDate")) {
    document.getElementById("rentDate").value = new Date().toISOString().split("T")[0];
}

// =======================================================
// ===== 1. تحميل وحفظ البيانات (مع تحديث الهيكل) =====
// =======================================================

// دالة مساعدة لضمان وجود حقل 'rentedPeriods' لكل قطعة
const ensurePeriods = (arr) => {
    return arr.map((item, index) => ({
        ...item,
        // مهم: التأكد من وجود ID أو استخدام الـ index القديم كمعرف إذا كان ID غير موجود
        id: item.id !== undefined ? item.id : index, 
        rentedPeriods: item.rentedPeriods || [] // إضافة الحقل إذا لم يكن موجوداً
    }));
};

function loadAll(){
    // تحميل البيانات وتطبيق دالة ensurePeriods
    pants = ensurePeriods(JSON.parse(localStorage.getItem("pants")) || []);
    gilets = ensurePeriods(JSON.parse(localStorage.getItem("gilets")) || []);
    vests = ensurePeriods(JSON.parse(localStorage.getItem("vests")) || []);
    shirts = ensurePeriods(JSON.parse(localStorage.getItem("shirts")) || []);
    belts = ensurePeriods(JSON.parse(localStorage.getItem("belts")) || []);
    shoes = ensurePeriods(JSON.parse(localStorage.getItem("shoes")) || []);
    ties = ensurePeriods(JSON.parse(localStorage.getItem("ties")) || []);
    bows = ensurePeriods(JSON.parse(localStorage.getItem("bows")) || []);
    broches = ensurePeriods(JSON.parse(localStorage.getItem("broches")) || []);
    
    // تعيين المتغيرات كمتغيرات عامة
    window.pants=pants; window.gilets=gilets; window.vests=vests;
    window.shirts=shirts; window.belts=belts; window.shoes=shoes;
    window.ties=ties; window.bows=bows; window.broches=broches;
}

function saveAll(){
    localStorage.setItem("pants",JSON.stringify(pants));
    localStorage.setItem("gilets",JSON.stringify(gilets));
    localStorage.setItem("vests",JSON.stringify(vests));
    localStorage.setItem("shirts",JSON.stringify(shirts));
    localStorage.setItem("belts",JSON.stringify(belts));
    localStorage.setItem("shoes",JSON.stringify(shoes));
    localStorage.setItem("ties",JSON.stringify(ties));
    localStorage.setItem("bows",JSON.stringify(bows));
    localStorage.setItem("broches",JSON.stringify(broches));
    localStorage.setItem("rentals",JSON.stringify(rentals));
    localStorage.setItem("available_colors", JSON.stringify(AVAILABLE_COLORS)); 
}

// =======================================================
// ===== 2. دوال مساعدة للتحقق من التوفر الزمني والحالة الحالية =====
// =======================================================

/**
 * تحدد حالة القطعة في الوقت الحالي (اليوم). (للاستخدام في صفحات التخزين)
 * @param {object} item - كائن القطعة
 * @returns {string} - الحالة ("مؤجر حالياً" أو "متوفر")
 */
function checkCurrentStatus(item) {
    const today = new Date();
    // لضمان مقارنة صحيحة، نحذف الوقت
    today.setHours(0, 0, 0, 0); 
    
    const periods = item.rentedPeriods || [];

    for (const period of periods) {
        if (period.isReturned) continue; 
        
        let start = new Date(period.start);
        let end = new Date(period.end);
        
        // تعديل التواريخ للتحقق بشكل صحيح (إضافة يوم)
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
        
        // التحقق: التاريخ الحالي يقع ضمن فترة التأجير (>= البداية و < النهاية)
        if (today >= start && today < end) {
            return "مؤجر حالياً";
        }
    }
    return "متوفر";
}

/**
 * تتحقق مما إذا كانت قطعة معينة متاحة خلال فترة زمنية محددة (لا يوجد تداخل). (للاستخدام في صفحة التأجير)
 */
function isItemAvailableInPeriod(itemArr, itemIndex, newStart, newEnd) {
    if (itemIndex === "" || !itemArr || itemIndex === null || itemIndex === undefined) return true; 
    
    const item = itemArr[itemIndex];
    if (!item) return true; 

    const periods = item.rentedPeriods || [];

    for (const period of periods) {
        if (period.isReturned) continue; 

        let existingStart = new Date(period.start);
        let existingEnd = new Date(period.end);
        existingStart.setDate(existingStart.getDate() + 1);
        existingEnd.setDate(existingEnd.getDate() + 1);

        // منطق التداخل (Overlap Logic)
        if (newStart < existingEnd && newEnd > existingStart) {
            return false; // القطعة محجوزة في هذه الفترة
        }
    }
    return true; // متاحة
}

// =======================================================
// ===== 3. تحديث القوائم المنسدلة (التصفية باللون والعرض) =====
// =======================================================

function refreshSelects(reset = false){
    loadAll();

    const rentDateStr = document.getElementById('rentDate').value;
    const returnDateStr = document.getElementById('returnDate').value;

    let filterStart = rentDateStr ? new Date(rentDateStr) : new Date();
    let filterEnd = returnDateStr ? new Date(returnDateStr) : new Date();

    filterStart.setDate(filterStart.getDate() + 1);
    filterEnd.setDate(filterEnd.getDate() + 1);

    const allItems = [
        { id: "pant", arr: pants, requiresColor: true },
        { id: "gilet", arr: gilets, requiresColor: true },
        { id: "vest", arr: vests, requiresColor: true },
        { id: "shirt", arr: shirts, requiresColor: false },
        { id: "belt", arr: belts, requiresColor: false },
        { id: "shoe", arr: shoes, requiresColor: false },
        { id: "tie", arr: ties, requiresColor: false },
        { id: "bow", arr: bows, requiresColor: false },
        { id: "broche", arr: broches, requiresColor: false }
    ];

    const currentSelections = {};
    allItems.map(x => x.id).forEach(id => {
        const el = document.getElementById(id);
        if (el) currentSelections[id] = el.value;
    });

    if (reset) {
        allItems.filter(x => x.requiresColor).map(x => x.id).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    const selectedColor = document.getElementById("color").value;

    allItems.forEach(itemInfo => {
        let s = document.getElementById(itemInfo.id);
        if (!s) return;

        s.innerHTML = "<option value=''>--اختيار--</option>";

        itemInfo.arr.forEach((item, index) => {
            // أ. التصفية حسب اللون
            if (itemInfo.requiresColor && selectedColor && item.color !== selectedColor) {
                return;
            }
            
            // ب. التحقق من التوفر الزمني لتحديد حالة التعطيل
            const isAvailableTime = isItemAvailableInPeriod(itemInfo.arr, index, filterStart, filterEnd);
            
            let o = document.createElement("option");
            o.value = index;
            
            let colorDisplay = (item.color) ? ` (${item.color})` : '';
            let statusText;
            
            if (isAvailableTime) {
                statusText = "متاح";
                o.disabled = false;
            } else {
                statusText = "مؤجر/غير متاح";
                o.disabled = true; // تعطيل الخيار
            }
            
            o.text = item.name + colorDisplay + (item.size ? " " + item.size : "") + ` (${statusText})`;
            
            s.appendChild(o);
        });
    });

    if (!reset) {
        allItems.map(x => x.id).forEach(id => {
            const el = document.getElementById(id);
            const savedValue = currentSelections[id];
            
            if (el && savedValue !== '') {
                 if (Array.from(el.options).some(o => o.value === savedValue)) {
                    el.value = savedValue;
                 }
            }
        });
    }
}

// =======================================================
// ===== 4. دوال التأجير والإرجاع والحذف (مُعدَّل) =====
// =======================================================

function get(arr,v){
    // 🛑 تحديث: عرض حالة القطعة الحالية في الجدول
    if(v==="" || !arr || arr[v] === undefined || arr[v] === null) return "";
    let item = arr[v];
    const status = checkCurrentStatus(item); // استخدام الدالة الجديدة
    return item.name + (item.size?" "+item.size:"") + (status === "مؤجر حالياً" ? " [مؤجر]" : "");
}

function renderRentals(list=rentals){
    let t=document.getElementById("rentalsBody");
    if (!t) return;

    t.innerHTML="";
    const today = new Date().toISOString().split('T')[0];
    
    list.forEach((r,i)=>{
        const mainColor = r.color || "-";
        
        let rowClass = r.returned ? 'returned' : '';
        if (!r.returned && r.returnDate < today) {
            rowClass = 'unavailable'; // تأخير
        } else if (!r.returned) {
            rowClass = 'available'; // تأجير حالي غير متأخر
        }

        t.innerHTML+=`
        <tr class="${rowClass}">
            <td>${r.fname}</td>
            <td>${r.phone}</td>
            <td>${mainColor}</td> 
            <td>${get(pants,r.pant)}</td>
            <td>${get(gilets,r.gilet)}</td>
            <td>${get(vests,r.vest)}</td>
            <td>${get(shirts,r.shirt)}</td>
            <td>${get(belts,r.belt)}</td>
            <td>${get(shoes,r.shoe)}</td>
            <td>${get(ties,r.tie)}</td>
            <td>${get(bows,r.bow)}</td>
            <td>${get(broches,r.broche)}</td>
            <td>${r.returnDate || "-"}</td>
            <td><button onclick="returnRental(${r.id})">إرجاع</button></td>
            <td><button onclick="deleteRental(${r.id})">حذف</button></td>
        </tr>`;
    });
}

window.addRental = function(){
    const fname = document.getElementById('fname');
    const phone = document.getElementById('phone');
    const color = document.getElementById('color');
    const pant = document.getElementById('pant');
    const gilet = document.getElementById('gilet');
    const vest = document.getElementById('vest');
    const shirt = document.getElementById('shirt');
    const belt = document.getElementById('belt');
    const shoe = document.getElementById('shoe');
    const tie = document.getElementById('tie');
    const bow = document.getElementById('bow');
    const broche = document.getElementById('broche');
    const rentDateEl = document.getElementById("rentDate"); 
    const returnDateEl = document.getElementById("returnDate");
    
    loadAll(); 

    const rentDateStr = rentDateEl.value;
    const returnDateStr = returnDateEl.value;

    if(!fname.value || !color.value || !returnDateStr || !rentDateStr) {
        alert("الرجاء ملء الاسم، اللون، وتاريخي التأجير والإرجاع.");
        return;
    }
    if (new Date(rentDateStr) >= new Date(returnDateStr)) {
        alert('تاريخ الإرجاع يجب أن يكون بعد تاريخ التأجير.');
        return;
    }

    let rentDate = new Date(rentDateStr);
    let returnDate = new Date(returnDateStr);
    rentDate.setDate(rentDate.getDate() + 1);
    returnDate.setDate(returnDate.getDate() + 1);

    const itemsToCheck = [
        { arr: pants, index: pant.value, name: 'السروال' },
        { arr: gilets, index: gilet.value, name: 'الجيلي' },
        { arr: vests, index: vest.value, name: 'الفاست' },
        { arr: shirts, index: shirt.value, name: 'القميص' },
        { arr: belts, index: belt.value, name: 'الحزام' },
        { arr: shoes, index: shoe.value, name: 'الحذاء' },
        { arr: ties, index: tie.value, name: 'الربطة' },
        { arr: bows, index: bow.value, name: 'الفراشة' },
        { arr: broches, index: broche.value, name: 'البروش' }
    ];

    let isAvailable = true;
    for (const itemInfo of itemsToCheck) {
        if (itemInfo.index !== "" && !isItemAvailableInPeriod(itemInfo.arr, itemInfo.index, rentDate, returnDate)) {
            alert(`عفواً، ${itemInfo.name} غير متوفر في الفترة المحددة!`);
            isAvailable = false;
            break;
        }
    }

    if (!isAvailable) return;
    
    const newRentalId = Date.now(); 

    let r={
        id: newRentalId,
        fname:fname.value,
        phone:phone.value,
        color:color.value,
        pant:pant.value,
        gilet:gilet.value,
        vest:vest.value,
        shirt:shirt.value,
        belt:belt.value,
        shoe:shoe.value,
        tie:tie.value,
        bow:bow.value,
        broche:broche.value,
        returned:false,
        rentDate: rentDateStr,
        returnDate: returnDateStr
    };

    itemsToCheck.forEach(itemInfo => {
        if (itemInfo.index !== "") {
            const period = {
                start: rentDateStr,
                end: returnDateStr,
                rentalId: newRentalId,
                isReturned: false
            };
            itemInfo.arr[itemInfo.index].rentedPeriods.push(period);
        }
    });
    
    rentals.push(r);
    saveAll(); 

    // مسح النموذج وإعادة تعيين التواريخ
    fname.value = '';
    phone.value = '';
    color.value = '';
    pant.value = '';
    gilet.value = '';
    vest.value = '';
    shirt.value = '';
    belt.value = '';
    shoe.value = '';
    tie.value = '';
    bow.value = '';
    broche.value = '';
    returnDateEl.value = ''; 
    rentDateEl.value = new Date().toISOString().split("T")[0]; 

    renderRentals();
    refreshSelects();
    
    alert("تم تأكيد عملية التأجير بنجاح.");
}

window.returnRental = function(id){ 
    loadAll();
    let r = rentals.find(rent => rent.id === id);
    if (!r) return;
    
    if (r.returned) {
        alert("هذه القطع تم إرجاعها مسبقاً.");
        return;
    }

    const allItems = [
        { arr: pants, key: "pant" }, { arr: gilets, key: "gilet" }, { arr: vests, key: "vest" },
        { arr: shirts, key: "shirt" }, { arr: belts, key: "belt" }, { arr: shoes, key: "shoe" },
        { arr: ties, key: "tie" }, { arr: bows, key: "bow" }, { arr: broches, key: "broche" }
    ];

    // تغيير حالة الفترة المحجوزة إلى "مُرجَعة"
    allItems.forEach(itemInfo => {
        const itemIndex = r[itemInfo.key];
        if(itemIndex !== "") {
            const item = itemInfo.arr[itemIndex];
            const periodIndex = item.rentedPeriods.findIndex(p => p.rentalId === r.id); 
            
            if (periodIndex > -1) {
                item.rentedPeriods[periodIndex].isReturned = true; // تحرير الفترة
            }
        }
    });
    
    r.returned=true;
    saveAll();
    renderRentals();
    refreshSelects();
}

window.deleteRental = function(id){ 
    if(!confirm("هل أنت متأكد من حذف المؤجر؟ سيتم تحرير القطع.")) return;
    
    // أولاً: إرجاع القطع وتحرير الفترة الزمنية
    returnRental(id); 
    
    // ثانياً: إزالة التأجير من مصفوفة rentals
    const indexToDelete = rentals.findIndex(r => r.id === id);
    if (indexToDelete > -1) {
        rentals.splice(indexToDelete, 1);
    }
    
    saveAll();
    renderRentals();
    refreshSelects();
}

// =======================================================
// ===== 5. التهيئة وربط الأحداث =====
// =======================================================

function initApp(){
    loadAll();
    
    AVAILABLE_COLORS = JSON.parse(localStorage.getItem("available_colors")) || ["أسود", "أزرق", "رمادي", "بني", "أبيض"]; 
    
    let colorSelect = document.getElementById("color");
    if (colorSelect) {
        colorSelect.innerHTML = '<option value="">--اختيار اللون--</option>'; 
        AVAILABLE_COLORS.forEach(color => {
            let option1 = document.createElement("option");
            option1.value = option1.text = color;
            colorSelect.appendChild(option1);
        });
    }
    
    renderRentals();
    refreshSelects(); 
    
    // ربط أحداث التغيير لتحديث القوائم المنسدلة عند تغيير التواريخ
    const rentDateEl = document.getElementById('rentDate');
    const returnDateEl = document.getElementById('returnDate');

    if (rentDateEl) {
        rentDateEl.addEventListener('change', () => refreshSelects(false));
    }
    if (returnDateEl) {
        returnDateEl.addEventListener('change', () => refreshSelects(false));
    }
}
initApp();

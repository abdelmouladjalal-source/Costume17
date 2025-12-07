let AVAILABLE_COLORS = []; 
let rentals = JSON.parse(localStorage.getItem("rentals")) || [];

let pants, gilets, vests, shirts, belts, shoes, ties, bows, broches;

// تعيين تاريخ اليوم كتاريخ تأجير افتراضي عند تحميل الصفحة
if (document.getElementById("rentDate")) {
    document.getElementById("rentDate").value = new Date().toISOString().split("T")[0];
}

// ===== 1. تحميل البيانات من التخزين المحلي =====
function loadAll(){
    pants = JSON.parse(localStorage.getItem("pants")) || [];
    gilets = JSON.parse(localStorage.getItem("gilets")) || [];
    vests = JSON.parse(localStorage.getItem("vests")) || [];
    shirts = JSON.parse(localStorage.getItem("shirts")) || [];
    belts = JSON.parse(localStorage.getItem("belts")) || [];
    shoes = JSON.parse(localStorage.getItem("shoes")) || [];
    ties = JSON.parse(localStorage.getItem("ties")) || [];
    bows = JSON.parse(localStorage.getItem("bows")) || [];
    broches = JSON.parse(localStorage.getItem("broches")) || [];
    
    window.pants=pants; window.gilets=gilets; window.vests=vests;
    window.shirts=shirts; window.belts=belts; window.shoes=shoes;
    window.ties=ties; window.bows=bows; window.broches=broches;
}

// ===== 2. حفظ البيانات في التخزين المحلي =====
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

// ===== 3. تعبئة القوائم (مع تطبيق منطق التصفية باللون) =====
function fillSelect(id, arr){
    let s = document.getElementById(id);
    if (!s) return;

    let selectedColor = document.getElementById("color").value; 
    
    // القطع التي تخضع للتصفية باللون
    const FILTERED_ITEMS_BY_COLOR = ["pant", "gilet", "vest"]; 

    let filteredArr;
    
    if (selectedColor && FILTERED_ITEMS_BY_COLOR.includes(id)) { 
        filteredArr = arr.map((item, index) => ({ item, index })).filter(x => x.item.color === selectedColor);
    } else {
        filteredArr = arr.map((item, index) => ({ item, index }));
    }

    s.innerHTML = "<option value=''>--اختيار--</option>";
    
    filteredArr.forEach(x => {
        let o = document.createElement("option");
        o.value = x.index; 
        
        let colorDisplay = (x.item.color) ? ` (${x.item.color})` : ''; 
        o.text = x.item.name + colorDisplay + (x.item.size ? " " + x.item.size : "") + " (" + x.item.status + ")";
        
        if (x.item.status != "متوفر") o.disabled = true;
        s.appendChild(o);
    });
}

// ===== 4. تحديث جميع القوائم (مع منطق الحفظ والاستعادة) =====
function refreshSelects(reset = false){
    loadAll(); 
    
    // 1. حفظ القيمة المختارة حالياً
    const currentSelections = {};
    const items = ["pant", "gilet", "vest", "shirt", "belt", "shoe", "tie", "bow", "broche"];
    items.forEach(id => {
        const el = document.getElementById(id);
        if (el) currentSelections[id] = el.value; 
    });

    // 2. منطق إعادة التعيين والمسح
    const pantSelect = document.getElementById("pant");
    const giletSelect = document.getElementById("gilet");
    const vestSelect = document.getElementById("vest");
    const pantSelected = pantSelect && pantSelect.value !== '';
    
    if (reset) {
        // إذا تم تغيير اللون (reset=true)، امسح كل شيء
        items.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    } else if (pantSelected) {
        // إذا تم اختيار السروال، نمسح الجيلي والفاست
        if (giletSelect) giletSelect.value = '';
        if (vestSelect) vestSelect.value = '';
    }

    // 3. إعادة ملء القوائم
    fillSelect("pant", pants);
    fillSelect("gilet", gilets);
    fillSelect("vest", vests);
    fillSelect("shirt", shirts);
    fillSelect("belt", belts);
    fillSelect("shoe", shoes);
    fillSelect("tie", ties);
    fillSelect("bow", bows);
    fillSelect("broche", broches);

    // 4. استعادة الاختيار المحفوظ
    if (!reset) {
        items.forEach(id => {
            const el = document.getElementById(id);
            const savedValue = currentSelections[id];
            
            if (el && savedValue !== '' && el.value === '') { 
                el.value = savedValue;
            }
        });
    }
}

// ===== 5. تهيئة الألوان والقوائم عند التحميل =====
function initApp(){
    loadAll();
    
    // 1. تحميل قائمة الألوان المحدثة من التخزين
    AVAILABLE_COLORS = JSON.parse(localStorage.getItem("available_colors")) || ["أسود", "أزرق", "رمادي", "بني", "أبيض"]; 
    
    // 2. تعبئة قائمة الألوان للتصفية
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
}
initApp();


// ===== 6. دوال التأجير والإرجاع والحذف =====

function get(arr,v){
    if(v==="" || !arr || !arr[v]) return "";
    let item = arr[v];
    return item.name + (item.size?" "+item.size:"");
}

function renderRentals(list=rentals){
    let t=document.getElementById("rentalsBody");
    if (!t) return;

    t.innerHTML="";
    list.forEach((r,i)=>{
        const mainColor = r.color || "-";
        
        t.innerHTML+=`
        <tr class="${r.returned?'returned':''}">
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
            <td><button onclick="returnRental(${i})">إرجاع</button></td>
            <td><button onclick="deleteRental(${i})">حذف</button></td>
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


    let r={
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
        rentDate: rentDateEl.value,
        returnDate: returnDateEl.value
    };
    if(!r.fname || !r.color || !r.returnDate) {
        alert("الرجاء ملء الاسم، اللون، وتاريخ الإرجاع.");
        return;
    }
    
    // تغيير حالة القطع إلى "مؤجر"
    if(r.pant!=="") pants[r.pant].status="مؤجر";
    if(r.gilet!=="") gilets[r.gilet].status="مؤجر";
    if(r.vest!=="") vests[r.vest].status="مؤجر";
    if(r.shirt!=="") shirts[r.shirt].status="مؤجر";
    if(r.belt!=="") belts[r.belt].status="مؤجر";
    if(r.shoe!=="") shoes[r.shoe].status="مؤجر";
    if(r.tie!=="") ties[r.tie].status="مؤجر";
    if(r.bow!=="") bows[r.bow].status="مؤجر";
    if(r.broche!=="") broches[r.broche].status="مؤجر";
    
    rentals.push(r);
    saveAll();
    renderRentals();
    
    // مسح بيانات النموذج بعد التأجير
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
    
    // إعادة تعيين تاريخ التأجير إلى تاريخ اليوم
    rentDateEl.value = new Date().toISOString().split("T")[0];

    refreshSelects(); 
    
    alert("تم تأكيد عملية التأجير بنجاح ومسح بيانات النموذج.");
}

window.returnRental = function(i){ 
    let r=rentals[i];
    if (r.returned) {
        alert("هذه القطع تم إرجاعها مسبقاً.");
        return;
    }
    loadAll(); 
    [pants,gilets,vests,shirts,belts,shoes,ties,bows,broches].forEach((arr,idx)=>{
        let k=["pant","gilet","vest","shirt","belt","shoe","tie","bow","broche"][idx];
        if(r[k]!=="") arr[r[k]].status="متوفر";
    });
    r.returned=true;
    saveAll();
    renderRentals();
    refreshSelects();
}

window.deleteRental = function(i){ 
    if(!confirm("حذف المؤجر مع إرجاع القطع؟")) return;
    returnRental(i); 
    rentals.splice(i,1);
    saveAll();
    renderRentals();
    refreshSelects();
}
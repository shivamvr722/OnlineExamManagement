let data, recordList, tempRecordsList;
let page = 0;
async function fetchResult() {
  const response = await fetch("/user/getresults");
  data = await response.json();

  if (data.success) {
    recordList = data.result;
    tempRecordsList = data.result;
    viewData(recordList,0, 10);
    document.querySelector(".pagination").hidden = false;
  } else {
    const tableBody = document.querySelector(".resultTable #tbody");
    tableBody.innerHTML = "<tr><td colspan=4 class='noRecords'>No&nbspRecords&nbspFound&nbsp:&nbsp(</td></tr>"
    document.querySelector(".pagination").hidden = true;
  }
  // console.log(data)
}
fetchResult();


// Paggination Code
const nextPage = () => {
  page++;
  var start = page * 10,
    end = (page + 1) * 10;
  viewData(recordList,start, end);
};

const previousPage = () => {
  page--;
  if (page <= 0) {
    viewData(recordList,0, 10);
    page = 0;
  } else {
    viewData(recordList,page * 10, (page + 1) * 10);
  }
};

const lastPage = () => {
  if (recordList.length == 0) {
    page = 0;
    viewData(recordList,0, 10);
  }
  else {
    page = Math.floor(recordList.length / 10);
    start = page * 10;
    end = start + (recordList.length % 10);
    viewData(recordList,start, end);

  }
};

const firstPage = () => {
  page = 0;
  viewData(recordList,0, 10);
};

// Generate table Row
const tableBody = document.querySelector(".resultTable #tbody");
const viewData = (recordList,start, end) => {
  const list = recordList;
 
  let html = "";
  if (end > list.length && list.length % 10 != 0) {
    end = start + (list.length % 10);
    if (end > list.length) {
      page--;
      return;
    }
  }
  else if (end > list.length) {
    page--;
    return;
  }
  console.log(list);
  for (let index = start; index < end; index++) {
   
    const examDate=dateTimeConverter(list[index].exam_date)
    
    html += `<tr>
    <td>${index + 1}</td> 
    <td>${list[index].exam_id}</td>
    <td>${(list[index].title)}</td>
    <td>${examDate.dateString}</td>
    <td><a class="viewBtn" href="/user/userscore?examid=${list[index].exam_id}"><p class = "viewBtnP">View Result</p></a> </td>       
    <td><a class="viewBtn" href="/user/useranswerkey?examid=${list[index].exam_id}"><p class = "viewBtnP">Review</p></a> </td>`;
  }
  tableBody.innerHTML = html;
};


const searchResults=()=>{
  const value = document.querySelector("#searchBar").value;
  const lValue = value.toLowerCase();
  if (lValue === "") {
    viewData(recordList,0,10)
    document.querySelector(".pagination").hidden = false;
  }
  console.log(recordList);
  let match = recordList.filter(data=>{
    
    if (data.exam_id == lValue || data.title.toLowerCase().includes(lValue) || data.exam_date.match(lValue)) {
      return data
    }
  })

  if (match.length) {    
    viewData(match,0,10) 
    if(match.length >= 10){
      document.querySelector(".pagination").hidden = false;
    }
  }else{
    const tableBody = document.querySelector(".resultTable #tbody");
    tableBody.innerHTML = "<tr><td colspan=6 class='noRecords' id='nr'>No Records Found :(</td></tr>"
    document.querySelector("#nr").style.textAlign = "center";
    document.querySelector(".pagination").hidden = true;
  }
}

// const dateTimeConverter = (dateTimeString) => {
//   const offset = new Date().getTimezoneOffset()
//   dateTimeString = new Date(dateTimeString).getTime() - (offset * 60 * 1000)
//   const timeString = new Date(dateTimeString).toLocaleTimeString()
//   const dateString = new Date(dateTimeString).toLocaleDateString('fr-CA', { day: '2-digit', month: '2-digit', year: 'numeric' });
//   return { timeString, dateString }
// }
document.querySelector("#searchBar").addEventListener("input", searchResults);

const {organizeByDate} = require('./organizeByDate');
module.exports.pagination = function(items, page, link, organize){ 
  var page = page || 1, pageSize = 50, offset = (page - 1) * pageSize, pageDatas = items.slice(offset).slice(0, pageSize), totalPages = Math.ceil(items.length / pageSize);
  var previousPage = page - 1 ? page - 1 : null, nextPage = (totalPages > page) ? page + 1 : null;
  return {
    page: page,
    previousPage:{
      no: previousPage,
      href: `${link.path}?page=${previousPage}&${link.queryString}`
    },
    nextPage:{
      no:nextPage,
      href:`${link.path}?page=${previousPage}&${link.queryString}`
    },
    datas: organize ? organizeByDate(pageDatas) : pageDatas,
    pageDetails:{
      offset: items.length > 0 ? offset + 1 : 0,
      skipped: offset + pageDatas.length,
      total: items.length, 
      totalPages: totalPages,
    }
  }  
} // pagination datas

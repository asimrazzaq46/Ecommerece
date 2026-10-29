const ErrorHandler = require("./errorHandler");
const { categoriesForKeyword } = require("./categories");
// UPDATED: whitelisted catalog sort orders (?sort=), newest first by default
const SORTS = { newest: {createdAt: -1, _id: -1}, price_asc: {price: 1, _id: -1}, price_desc: {price: -1, _id: -1}, rating: {rating: -1, _id: -1} };
class ApiFeatures {
  constructor(query, querystr) { this.query = query; this.querystr = querystr; }
  search() {
    const keyword = this.querystr.keyword;
    if (keyword !== undefined && (typeof keyword !== "string" || keyword.length > 100)) throw new ErrorHandler("Invalid search keyword", 400);
    if (keyword) {
      const name = {$regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i"};
      // UPDATED: a keyword that names a category also returns that category's products
      const categories = categoriesForKeyword(keyword);
      this.query = this.query.find(categories.length ? {$or: [{name}, {catagory: {$in: categories}}]} : {name});
    }
    return this;
  }
  filter() {
    const filters = {};
    if (this.querystr.catagory !== undefined) {
      if (typeof this.querystr.catagory !== "string") throw new ErrorHandler("Invalid category", 400);
      filters.catagory = this.querystr.catagory;
    }
    for (const field of ["price", "rating"]) {
      const value = this.querystr[field];
      if (value === undefined) continue;
      const numeric = raw => {
        if (typeof raw !== "string" || !raw.trim() || !Number.isFinite(Number(raw)) || Number(raw) < 0) throw new ErrorHandler("Invalid numeric filter", 400);
        return Number(raw);
      };
      if (typeof value === "string") filters[field] = numeric(value);
      else {
        if (!value || Array.isArray(value)) throw new ErrorHandler("Invalid filter", 400);
        filters[field] = {};
        for (const [operator, raw] of Object.entries(value)) {
          if (!["gt", "gte", "lt", "lte"].includes(operator)) throw new ErrorHandler("Invalid filter operator", 400);
          filters[field]["$" + operator] = numeric(raw);
        }
      }
    }
    this.query = this.query.find(filters);
    return this;
  }
  pagination(resultPerPage) {
    const raw = this.querystr.page;
    const page = raw === undefined ? 1 : Number(raw);
    if ((raw !== undefined && typeof raw !== "string") || !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger((page - 1) * resultPerPage)) throw new ErrorHandler("Invalid page number", 400);
    const sort = this.querystr.sort === undefined ? "newest" : this.querystr.sort;
    if (typeof sort !== "string" || !Object.hasOwn(SORTS, sort)) throw new ErrorHandler("Invalid sort order", 400);
    this.query = this.query.sort(SORTS[sort]).limit(resultPerPage).skip(resultPerPage * (page - 1));
    return this;
  }
}
module.exports = ApiFeatures;

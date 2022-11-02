class APIFeatures {
  /**
   * @param {object} query an object of query (in mongoose)
   * @param {object} queryString queryString in URL (req.query)
   *
   * Returns an object query (in mongoose)
   */
  constructor(query, queryString) {
    this.query = query; //tour.find(),access query methods
    this.queryString = queryString; //req.query
  }

  filter() {
    const queryObj = { ...this.queryString }; //deep copy of queryString
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj); //allows use of string methods
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); //add '$' before operations (to work with mongodb)

    this.query = this.query.find(JSON.parse(queryStr)); //query already made, no need for tour.find()
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; //skip all previous pages/results
    //results = page*limit

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;

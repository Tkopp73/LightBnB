const properties = require('./json/properties.json');
const users = require('./json/users.json');
const {Pool} = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

pool.connect()
.then(() => {
  console.log('CONNECTED!');
})
.catch(err => console.error('Error:', err));


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query('SELECT * FROM users WHERE email = $1', [email])
  .then((result) => {
    // console.log('getUserWithEmail:', result.rows);
    return result.rows;
  })
  .catch((err) => {
    return null;
  });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
   return pool.query('SELECT * FROM users WHERE id = $1', [id])
  .then((result) => {
    // console.log('getUserWithId:', result.rows);
    return result.rows;
  })
  .catch((err) => {
    return err;
  });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const email = user.email;
  const password = user.password;
  const name = user.name;
  return pool.query(`INSERT INTO users (name, password, email)
  VALUES ($1, $2, $3);`, [name, password, email])
  .then((result) => {
    return result.rows[0]
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`SELECT properties.*, reservations.start_date, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  JOIN reservations ON reservations.property_id = properties.id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.start_date
  LIMIT $2;`, [guest_id, limit])
  .then ((result) => {
    return result.rows
  })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
  console.log('options', options)
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id`;

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `
    WHERE owner_id = $${queryParams.length}`
  }

  if (options.city || options.minimum_price_per_night || options.maximum_price_per_night || options.minimum_rating){
    queryString += `
  WHERE`
  };

  if (options.city){
    queryParams.push(`%${options.city}%`);
    queryString += ` city Like $${queryParams.length}`
  }

  if(options.city && options.minimum_price_per_night){
    queryString += ` and`
  }

  if (options.minimum_price_per_night){
    queryParams.push((options.minimum_price_per_night * 100));
    queryString += ` cost_per_night > $${queryParams.length}`
  }

  if(options.minimum_price_per_night && options.maximum_price_per_night){
    queryString += ` and`
  }

  if(options.city && options.maximum_price_per_night && !options.minimum_price_per_night){
    queryString += ` and`
  }
  
  if (options.maximum_price_per_night){
    queryParams.push((options.maximum_price_per_night * 100));
    queryString += ` cost_per_night < $${queryParams.length}`
  }
  
  
  queryString += `
  GROUP BY properties.id`
  ;
  
  if (options.minimum_rating){
    queryParams.push(Number(options.minimum_rating));
    queryString += ` HAVING avg(property_reviews.rating) >= $${queryParams.length}`
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`
  console.log('query', queryString, queryParams);

  return pool.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return err.message;
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryParams = [
    property.owner_id, 
    property.title, 
    property.description, 
    property.thumbnail_photo_url, 
    property.cover_photo_url, 
    property.cost_per_night, 
    property.street, 
    property.city, 
    property.province, 
    property.post_code, 
    property.country, 
    property.parking_spaces, 
    property.number_of_bathrooms, 
    property.number_of_bedrooms]
  return pool.query(`
  INSERT INTO properties (  owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms) 
    Values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;`, queryParams)
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    return err;
  });
}
exports.addProperty = addProperty;

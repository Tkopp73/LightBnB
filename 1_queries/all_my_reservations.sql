
SELECT properties.id, title, cost_per_night, reservations.start_date, avg(property_reviews.rating) as average_rating
FROM properties
JOIN property_reviews ON properties.id = property_id
JOIN reservations ON reservations.property_id = properties.id
WHERE reservations.guest_id = 1
GROUP BY properties.id, reservations.start_date
ORDER BY reservations.start_date
LIMIT 10;
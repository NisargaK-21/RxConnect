exports.up = (pgm) => {
  pgm.addColumns("users", {
    phone: {
      type: "varchar(20)",
    },
    address: {
      type: "text",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("users", ["phone", "address"]);
};
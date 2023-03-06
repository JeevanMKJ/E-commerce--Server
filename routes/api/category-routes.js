const router = require("express").Router();
const { Category, Product } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Product,
          attributes: ["id", "price", "product_name", "stock", "category_id"],
        },
      ],
    });
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve categories" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Product,
          attributes: ["id", "price", "product_name", "stock", "category_id"],
        },
      ],
    });
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(200).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve category" });
  }
});

router.post("/", async (req, res) => {
  try {
    const category = await Category.create({
      category_name: req.body.category_name,
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create category" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const [rowsUpdated] = await Category.update(req.body, {
      where: { id: req.params.id },
    });
    if (rowsUpdated !== 1) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(200).json({ message: "Category updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const rowsDeleted = await Category.destroy({
      where: { id: req.params.id },
    });
    if (rowsDeleted !== 1) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;

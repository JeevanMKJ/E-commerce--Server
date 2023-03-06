const router = require("express").Router();
const { Tag, Product, ProductTag } = require("../../models");

// GET all tags
router.get("/", async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [
        {
          model: Product,
          as: "product_tags",
          attributes: ["id", "price", "product_name", "stock", "category_id"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    res.status(200).json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get tags" });
  }
});

// GET a single tag by id
router.get("/:id", async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: "product_tags",
          attributes: ["id", "price", "product_name", "stock", "category_id"],
          through: {
            attributes: [],
          },
        },
      ],
    });
    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
    } else {
      res.status(200).json(tag);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get tag" });
  }
});

// CREATE a new tag
router.post("/", async (req, res) => {
  try {
    const newTag = await Tag.create({
      tag_name: req.body.tag_name,
    });

    // Add association with products
    if (req.body.productIds && req.body.productIds.length > 0) {
      const products = await Product.findAll({
        where: { id: req.body.productIds },
      });
      await newTag.addProducts(products);
    }

    res.status(201).json(newTag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tag" });
  }
});

// UPDATE a tag by id
router.put("/:id", async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    // Update tag name
    await tag.update({ tag_name: req.body.tag_name });

    // Update association with products
    if (req.body.productIds) {
      const products = await Product.findAll({
        where: { id: req.body.productIds },
      });
      await tag.setProducts(products);
    }

    res.status(200).json(tag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update tag" });
  }
});

// DELETE a tag by id
router.delete("/:id", async (req, res) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) {
      res.status(404).json({ error: "Tag not found" });
      return;
    }

    // Remove association with products
    await tag.setProducts([]);

    // Delete tag
    await tag.destroy();

    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

module.exports = router;

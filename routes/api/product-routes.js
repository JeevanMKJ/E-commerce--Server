const router = require("express").Router();
const {
  Product,
  Category,
  Tag,
  ProductTag,
  sequelize,
} = require("../../models");

router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "category_name"],
        },
        {
          model: Tag,
          attributes: ["id", "tag_name"],
          through: { attributes: [] },
          as: "product_tags",
        },
      ],
    });
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Category,
          attributes: ["id", "category_name"],
        },
        {
          model: Tag,
          attributes: ["id", "tag_name"],
          through: { attributes: [] },
          as: "product_tags",
        },
      ],
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { product_name, price, stock, category_id, tagIds } = req.body;
    if (!product_name || !price || !stock || !category_id) {
      return res.status(400).json({ message: "Invalid input data" });
    }
    const product = await sequelize.transaction(async (t) => {
      const newProduct = await Product.create(
        {
          product_name,
          price,
          stock,
          category_id,
        },
        { transaction: t }
      );
      if (tagIds && tagIds.length) {
        const tags = await Tag.findAll({ where: { id: tagIds } });
        if (tags.length !== tagIds.length) {
          throw new Error("Invalid tag ids");
        }
        const productTags = tagIds.map((tag_id) => ({
          product_id: newProduct.id,
          tag_id,
        }));
        await ProductTag.bulkCreate(productTags, { transaction: t });
      }
      return newProduct;
    });
    const savedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          attributes: ["id", "category_name"],
        },
        {
          model: Tag,
          attributes: ["id", "tag_name"],
          through: { attributes: [] },
          as: "product_tags",
        },
      ],
    });
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { product_name, price, stock, category_id, tagIds } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(400).json({ message: "Invalid category id" });
      }
    }

    if (tagIds && tagIds.length) {
      const tags = await Tag.findAll({ where: { id: tagIds } });
      if (tags.length !== tagIds.length) {
        return res.status(400).json({ message: "Invalid tag ids" });
      }
    }

    const updatedProduct = await sequelize.transaction(async (t) => {
      await product.update(
        {
          product_name: product_name || product.product_name,
          price: price || product.price,
          stock: stock || product.stock,
          category_id: category_id || product.category_id,
        },
        { transaction: t }
      );

      if (tagIds && tagIds.length) {
        await ProductTag.destroy(
          { where: { product_id: productId } },
          { transaction: t }
        );
        const productTags = tagIds.map((tag_id) => ({
          product_id: productId,
          tag_id,
        }));
        await ProductTag.bulkCreate(productTags, { transaction: t });
      } else {
        await ProductTag.destroy(
          { where: { product_id: productId } },
          { transaction: t }
        );
      }

      return await Product.findByPk(productId, {
        include: [
          {
            model: Category,
            attributes: ["id", "category_name"],
          },
          {
            model: Tag,
            attributes: ["id", "tag_name"],
            through: { attributes: [] },
            as: "product_tags",
          },
        ],
      });
    });

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await sequelize.transaction(async (t) => {
      await ProductTag.destroy(
        { where: { product_id: productId } },
        { transaction: t }
      );
      await product.destroy({ transaction: t });
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

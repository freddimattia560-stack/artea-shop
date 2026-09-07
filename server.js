const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const cors = require("cors");

require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

if (!process.env.STRIPE_SECRET_KEY) {
console.error("ERRORE: STRIPE_SECRET_KEY non configurata nel file .env");
process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
origin: true
}));

app.use(express.json());

app.use(express.static(__dirname));

app.get("/", (req, res) => {
res.sendFile(
path.join(__dirname, "indexfinal1.html")
);
});

app.post("/create-checkout-session", async (req, res) => {
try {
const cart = req.body.cart;

    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({
            error: "Il carrello è vuoto."
        });
    }

    const lineItems = cart.map((item) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);

        if (
            !item.name ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            throw new Error("Prodotto non valido.");
        }

        return {
            price_data: {
                currency: "eur",
                product_data: {
                    name: String(item.name)
                },
                unit_amount: Math.round(price * 100)
            },
            quantity: quantity
        };
    });

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        customer_creation: "always",
        billing_address_collection: "required",

        shipping_address_collection: {
            allowed_countries: ["IT"]
        },

        success_url:
            "https://artea-shop-2.onrender.com/success.html",

        cancel_url:
            "https://artea-shop-2.onrender.com/carrello.html"
    });

    res.json({
        url: session.url
    });

} catch (error) {
    console.error("Errore Stripe:", error);

    res.status(500).json({
        error:
            error.message ||
            "Errore nella creazione del pagamento."
    });
}

});

app.listen(PORT, () => {
console.log(
"Server ARTEA avviato su http://localhost:" +
PORT
);
});
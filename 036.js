// Microservices Architecture for E-commerce

// Import necessary libraries
import express from 'express';
import bodyParser from 'body-parser';
import { ApolloServer, gql } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';
import mongoose from 'mongoose';
import amqp from 'amqplib/callback_api';
import { v4 as uuidv4 } from 'uuid';

// Initialize Express app
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Initialize GraphQL server
const pubsub = new PubSub();
const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    imageUrl: String
  }

  type Query {
    products: [Product]
    product(id: ID!): Product
  }

  type Mutation {
    addProduct(name: String!, price: Float!, description: String, imageUrl: String): Product
    updateProduct(id: ID!, name: String, price: Float, description: String, imageUrl: String): Product
    deleteProduct(id: ID!): Product
  }

  type Subscription {
    productAdded: Product
  }
`;

const resolvers = {
  Query: {
    products: async () => {
      return await Product.find();
    },
    product: async (_, { id }) => {
      return await Product.findById(id);
    }
  },
  Mutation: {
    addProduct: async (_, { name, price, description, imageUrl }) => {
      const product = new Product({ name, price, description, imageUrl });
      await product.save();
      pubsub.publish('PRODUCT_ADDED', { productAdded: product });
      return product;
    },
    updateProduct: async (_, { id, name, price, description, imageUrl }) => {
      const product = await Product.findByIdAndUpdate(id, { name, price, description, imageUrl }, { new: true });
      return product;
    },
    deleteProduct: async (_, { id }) => {
      const product = await Product.findByIdAndDelete(id);
      return product;
    }
  },
  Subscription: {
    productAdded: {
      subscribe: () => pubsub.asyncIterator(['PRODUCT_ADDED'])
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app });

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Product schema and model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  imageUrl: String,
});

const Product = mongoose.model('Product', productSchema);

// RabbitMQ setup for message queuing
amqp.connect('amqp://localhost', (error0, connection) => {
  if (error0) {
    throw error0;
  }
  connection.createChannel((error1, channel) => {
    if (error1) {
      throw error1;
    }
    const queue = 'product_queue';

    channel.assertQueue(queue, {
      durable: false
    });

    channel.consume(queue, (msg) => {
      const productData = JSON.parse(msg.content.toString());
      const product = new Product(productData);
      product.save();
      console.log(" [x] Received '%s'", msg.content.toString());
    }, {
      noAck: true
    });
  });
});

// API routes
app.post('/api/addProductToQueue', (req, res) => {
  const { name, price, description, imageUrl } = req.body;
  const productData = { name, price, description, imageUrl };

  amqp.connect('amqp://localhost', (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      const queue = 'product_queue';

      channel.assertQueue(queue, {
        durable: false
      });

      channel.sendToQueue(queue, Buffer.from(JSON.stringify(productData)));
      console.log(" [x] Sent '%s'", JSON.stringify(productData));

      setTimeout(() => {
        connection.close();
      }, 500);
    });
  });

  res.status(200).json({ message: 'Product added to queue' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Dockerfile for the microservice
/*
FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
*/

// Example frontend code using React and Apollo Client
import React, { useState, useEffect } from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache, useSubscription, useMutation, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache()
});

const GET_PRODUCTS = gql`
  subscription {
    productAdded {
      id
      name
      price
      description
      imageUrl
    }
  }
`;

const ADD_PRODUCT = gql`
  mutation AddProduct($name: String!, $price: Float!, $description: String, $imageUrl: String) {
    addProduct(name: $name, price: $price, description: $description, imageUrl: $imageUrl) {
      id
      name
      price
      description
      imageUrl
    }
  }
`;

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data, loading, error } = useSubscription(GET_PRODUCTS);
  const [addProduct] = useMutation(ADD_PRODUCT);

  useEffect(() => {
    if (data) {
      setProducts((prevProducts) => [...prevProducts, data.productAdded]);
    }
  }, [data]);

  const handleAddProduct = async () => {
    await addProduct({ variables: { name, price: parseFloat(price), description, imageUrl } });
    setName('');
    setPrice('');
    setDescription('');
    setImageUrl('');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>E-commerce Platform</h1>
      <div>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button onClick={handleAddProduct}>Add Product</button>
      </div>
      <div>
        <h2>Products</h2>
        <ul>
          {products.map((product) => (
            <li key={product.id}>
              {product.name} - ${product.price}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const AppWithApollo = () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);

export default AppWithApollo;
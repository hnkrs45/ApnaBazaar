import axios from 'axios';

const add = async () => {
    try {
        const res = await axios.post('http://localhost:3000/api/vendor/addproduct', {
            name: "Test Multi Image",
            description: "Testing",
            price: 100,
            category: "Other",
            images: [
                "https://res.cloudinary.com/do9m8kc0b/image/upload/v1714553258/sample.jpg",
                "https://res.cloudinary.com/do9m8kc0b/image/upload/v1714553258/cld-sample.jpg"
            ],
            stock: 10
        });
        console.log(res.data);
    } catch (e) {
        console.log(e.response ? e.response.data : e.message);
    }
}
add();

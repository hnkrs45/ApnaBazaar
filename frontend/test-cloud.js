import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const upload = async () => {
    const CLOUDINARY_UPLOAD_PRESET = "ecommerce";
    const CLOUDINARY_CLOUD_NAME = "do9m8kc0b";
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData1 = new FormData();
    formData1.append('file', fs.createReadStream('./package.json'));
    formData1.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const formData2 = new FormData();
    formData2.append('file', fs.createReadStream('./vite.config.js'));
    formData2.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const res = await Promise.all([
            axios.post(CLOUDINARY_URL, formData1, { headers: formData1.getHeaders() }),
            axios.post(CLOUDINARY_URL, formData2, { headers: formData2.getHeaders() })
        ]);
        console.log("Success:", res.map(r => r.data.secure_url));
    } catch (e) {
        console.log("Error:", e.response ? e.response.data : e.message);
    }
}

upload();

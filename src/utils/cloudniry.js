import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key:process.env.API_KEY,
  api_secret:process.env.API_SECURE,
});

const uploadCloudinary = async(localFilePath)=>{
    try {
        if (!localFilePath) return null 
       const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // console.log('fileis upload', response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}
// const uploadOnCloudinary = async(localFilePath)=>{
//     try {
//         if (!localFilePath) return null 
//         await cloudinary.uploader.upload(localFilePath, {
//             resource_type:"auto"
//         })
//         console.log('fileis upload', response.url);
//         return response
//     } catch (error) {
//         fs.unlinkSync(localFilePath)
//         return null
//     }
// }



// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });

export {uploadCloudinary}
// export {uploadOnCloudinary}
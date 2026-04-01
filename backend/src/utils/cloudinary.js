import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_KEY_SECRET,
    
})
const uploadFileOnCloudinary=async(filePath)=>{
    try { 
        if(!filePath)
            return null;
        //upload to cloudinary
       const response=  await cloudinary.uploader.upload(filePath,{
            resource_type:"auto"
        })
    
        //return the response  of the uploaded file
        return response;
    }

    
        
     catch (error) {
        fs.unlinkSync(filePath)
        // remove the file from local storage
        return null;
    }
    

}

export {uploadFileOnCloudinary};
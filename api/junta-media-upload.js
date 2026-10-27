import { put } from '@vercel/blob';

const UPLOAD_TOKEN='d0ca01db5587b7e6e445088e734eeaf7eada174a5003662a';

export const config={api:{bodyParser:false}};

export default async function handler(req,res){
  if(req.method!=='PUT'){
    res.setHeader('Allow','PUT');
    return res.status(405).json({error:'method_not_allowed'});
  }
  if(req.headers['x-junta-upload-token']!==UPLOAD_TOKEN){
    return res.status(401).json({error:'unauthorized'});
  }
  try{
    const blob=await put('junta/apresentacao-v1.mp4',req,{
      access:'public',
      addRandomSuffix:false,
      allowOverwrite:true,
      contentType:'video/mp4',
      cacheControlMaxAge:31536000,
    });
    return res.status(200).json({url:blob.url,pathname:blob.pathname,contentType:blob.contentType});
  }catch(error){
    console.error('junta media upload failed',error);
    return res.status(500).json({error:'upload_failed',message:error?.message||'unknown'});
  }
}

import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        minlength: [3, 'Content must be at least 3 characters']
    },
    // image URL stored in Cloudinary (optional)
    image: {
        type: String,
        required: false,
        trim: true
    },
    // store cloudinary public_id (optional) for deletion/management
    imagePublicId: {
        type: String,
        required: false,
        trim: true
    },
    
    interests: {
        type: [String],
        required: false,
        default: []
    },
    author: {
         type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    }
}, { timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }});

postSchema.index({ author: 1, createdAt: -1 });
export default mongoose.model("Post", postSchema);

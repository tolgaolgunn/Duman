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
    image: {
        type: String,
        required: false,
        trim: true
    },
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
    likes: {
        type: [String],
        required: false,
        default: []
    },
    comments: {
        type: [
            {
                author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                content: { type: String, required: true, trim: true },
                createdAt: { type: Date, default: Date.now }
            }
        ],
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

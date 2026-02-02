"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const goods_1 = __importDefault(require("./goods"));
const userSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    city: {
        type: String,
        default: "samara"
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: false,
        default: ""
    },
    shownBoughtFavorites: {
        type: Boolean,
        default: false
    },
    hiddenSections: [String],
    favoriteSections: [String],
    notifications: {
        updates: {
            enabled: {
                type: Boolean,
                default: false
            }
        }
    },
    favorites: [
        {
            status: {
                updatedAt: String,
                createdAt: String,
                deleted: Boolean
            },
            item: goods_1.default
        }
    ]
}, {
    timestamps: true
});
exports.default = userSchema;

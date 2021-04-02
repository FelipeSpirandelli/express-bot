import mongoose from 'mongoose'

export interface Product
{
	id: number
	name: string
}

export type UserType = mongoose.Document & 
{
	id: number
	processedMessages: number[]
	stage: number
	startedAt: string // Date
	products: Product[]
}

const UserSchema = new mongoose.Schema(
	{
		id: {type: Number, required: true},
		processedMessages: [{type: Number, required: true}],
		stage: {type: Number, required: true},
		startedAt: {type: Date, default: Date.now(), expires: 24 * 3600},
		products:
		[{
			id: {type: Number, required: true},
			name: {type: String, required: true},
			quantity: {type: Number, required: true}
		}]
	})

export default mongoose.model<UserType>('User', UserSchema)
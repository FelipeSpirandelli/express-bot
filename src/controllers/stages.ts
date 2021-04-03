import Update, { User } from '../models/Update'
import api from '../services/telegram/api'
import apiVtex from '../services/vtex/api'
import formatPrice from '../utils/formatPrice'
import bot from './bot'
import users from './users'

const stages =
{
	welcome: async (update: Update) =>
	{
		await users.start(update)

		const params =
		{
			chat_id: update.message.chat.id,
			text:
			'🎉 Olá! Tudo bem? 🎉' +
			'\nEu sou um bot, e estou aqui para te ajudar a realizar seu pedido.' +
			'\n\nVamos lá... diga-me o nome de um produto que você deseja pesquisar.'
		}

		api.post('sendMessage', params)
	},

	selectProducts: async (text: string, update: Update, user: User) =>
	{
		const isUserSelectingQuantity = await users.isUserSelectingQuantity(user)

		if (!isUserSelectingQuantity.answer)
		{
			if (text === '/finalizar')
			{
				users.nextStage(user)

				const cartDisplay = await users.getCartDisplay(user)
				await bot.sendMessage(update, cartDisplay)

				bot.sendMessage(update,
					'Pedido finalizado com sucesso!' +
				'\n\n <code>Confirmar:</code> /confirmar'
				)
			}
			else if (['/selecionar', '/editar'].includes(text.split('_')[0]))
			{
				const productId = Number(text.split('_')[1])
				const product = apiVtex.getProduct(productId)

				if (!product)
				{
					bot.sendMessage(update,
						'Produto não encontrado!' +
						'\nTente pesquisar novamente por um produto.'
					)
				}
				else
				{
					await users.toggleIsUserSelectingQuantity(user, productId)

					bot.sendMessage(update,
						`Qual a quantidade que você deseja comprar de ${product.name}?` +
						'\nOBS.: Digite somente números maiores que 0'
					)
				}
			}
			else
			{
				const search = text.trim()
				const products = apiVtex.searchProducts(search)

				if (products.length === 0)
					bot.sendMessage(update, 
						'Eu não encontrei produtos com base na sua pesquisa. 😞' +
					'\n\n Que tal pesquisar por outro produto?'
					)

				const productsDisplay = products.map((product) => (
					`\n\n➡️ <b>${product.name} (${product.brand})</b>` +
				`\n${product.description}` +
				`\n${formatPrice(product.price)}` +
				`\n<code>Selecionar:</code> /selecionar_${product.id}`
				)).join('')

				await bot.sendMessage(update, 
					'Eu encontrei os seguintes produtos:' +
					productsDisplay
				)

				bot.sendMessage(update,
					'Se você quiser pesquisar por outro produto, basta digitar que eu cuido disso para você.' +
					'\n\n<code>Finalizar:</code> /finalizar'
				)
			}
		}
		else
		{
			const product = isUserSelectingQuantity.product
			if (!product)
				return

			if (text === '/cancelar')
			{
				await users.toggleIsUserSelectingQuantity(user)

				return bot.sendMessage(update,
					'Pronto... Já cancelei!' +
					'\nSe você quiser pesquisar por outro produto, basta digitar que eu cuido disso para você.' +
					'\n\n<code>Finalizar:</code> /finalizar'
				)
			}

			const quantity = Number(text)

			if (isNaN(quantity) || quantity < 1)
				return bot.sendMessage(update,
					'Você me mandou uma quantidade inválida! Vamos tentar novamente...' +
					`\n\nQual a quantidade que você deseja comprar de ${product.name}?` +
					'\nOBS.: Digite somente números maiores que 0' +
					'\n\n<code>Cancelar:</code> /cancelar'
				)

			await users.addProduct(user, product, quantity)
			await users.toggleIsUserSelectingQuantity(user)
			
			const cartDisplay = await users.getCartDisplay(user)
			await bot.sendMessage(update, cartDisplay)

			return bot.sendMessage(update,
				'Produto adicionado com sucesso!' +
				'\nDiga-me o nome de mais um produto que você deseja pesquisar.' +
				'\n\n<code>Finalizar:</code> /finalizar'
			)
		}
	},

	reviewProducts: async (text: string, update: Update, user: User) =>
	{
		const cartDisplay = await users.getCartDisplay(user)
		await bot.sendMessage(update, cartDisplay)

		if (text === '/confirmar')
		{
			users.remove(user)

			bot.sendMessage(update,
				'Pedido confirmado com sucesso!' +
				'\n\n🤗 Obrigado por comprar conosco! Volte sempre!!!'
			)
		}
		else if (text.split('_')[0] === '/remover')
		{
			const productId = Number(text.split('_')[1])
			await users.removeProduct(user, productId)

			bot.sendMessage(update,
				'Produto removido com sucesso!' +
				'\n\n <code>Confirmar:</code> /confirmar'
			)
		}
	}
}

export default stages
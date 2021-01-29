/**
 * Domain model
 */
export interface Domain {
	/**
	 * Primary domain
	 *
	 * @example
	 * 'my-site.com'
	 */
	primary: string;

	/**
	 * Optional domains to be appended to primary domain certificate
	 *
	 * @example
	 * [ 'www.my-site.com', 'sub.my-site.com' ]
	 */
	optional?: string[];
}

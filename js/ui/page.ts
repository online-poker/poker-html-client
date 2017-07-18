
/**
 * Interface for the page
 */
interface Page {
    /**
     * Method called upon page activation.
     * pageName String Name of the page which is activated.
     */
    activate(pageName?: string): void;
    /**
     * Method called upon page deactivation.
     * pageName String Name of the page which is deactivated.
     */
    deactivate(pageName?: string): void;
    /**
     * Performs check that page could be activated
     */
    canActivate?(): boolean;
}

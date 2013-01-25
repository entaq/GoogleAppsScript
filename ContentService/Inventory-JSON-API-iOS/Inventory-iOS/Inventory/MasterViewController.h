
#import <UIKit/UIKit.h>

@interface MasterViewController : UITableViewController {
    NSArray *Items;
}

- (void)fetchItems;
- (IBAction)refreshItems:(id)sender;

@end
